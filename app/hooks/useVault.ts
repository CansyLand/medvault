"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration
} from "@simplewebauthn/browser";
import { del, get, set } from "idb-keyval";
import { toast } from "sonner";
import {
  generateEntityKeyPair,
  generateInviteCode,
  generateShareCode,
  openSealedPrivateKey,
  sealPrivateKeyForInvite,
  sealKeyForShare,
  unwrapPrivateKey,
  wrapPrivateKey,
  encryptJson,
  decryptJson,
  type SealedInvitePayload,
  type EncryptedPayload
} from "../lib/crypto";
import {
  clearSession,
  consumeInvite,
  createInvite,
  createSession,
  getSession,
  initEntity,
  initEntityIfExists,
  linkPasskey,
  resetAll,
  createShare,
  consumeShare,
  revokeShare,
  getShares,
  transferToPatient,
  savePublicProfile,
  type SharesResponse,
  type EntityRole
} from "../lib/api";
import {
  type PatientProfile,
  type ProviderProfile,
  type UserProfile,
  PropertyKeyPrefixes,
  isPatientProfile,
  isProviderProfile,
  getDisplayName,
} from "../types/medical";
import { useEventStream, type EntityState, type EntityEvent } from "./useEventStream";

const CREDENTIAL_ID_KEY = "passkeyCredentialId";
const USER_ID_KEY = "passkeyUserId";
const ENTITY_KEY_PREFIX = "entityKey:";

type WrappedKeyRecord = { wrapped: string; nonce: string };

function randomBase64Url(size = 32): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getLocal(key: string): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(key) : null;
}

function setLocal(key: string, value: string): void {
  localStorage.setItem(key, value);
}

function removeLocal(key: string): void {
  localStorage.removeItem(key);
}

export function useVault() {
  const [signedIn, setSignedIn] = useState(false);
  const [supportsPasskeys, setSupportsPasskeys] = useState(false);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [entityRole, setEntityRole] = useState<EntityRole | null>(null);
  const [entityPrivateKey, setEntityPrivateKey] = useState<Uint8Array | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState<{ code: string; expiresAt: number } | null>(null);
  const [isNewEntity, setIsNewEntity] = useState(false);
  const restoreAttemptedRef = useRef(false);
  const [restoreDone, setRestoreDone] = useState(false);
  
  // Ref to store role for new entity creation (set before passkey registration)
  const pendingRoleRef = useRef<EntityRole | null>(null);

  // Share-related state
  const [sharePropertyName, setSharePropertyName] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [generatedShare, setGeneratedShare] = useState<{ code: string; propertyName: string; expiresAt: number } | null>(null);
  const [shares, setShares] = useState<SharesResponse>({ outgoing: [], incoming: [] });
  const [pendingShareCodes, setPendingShareCodes] = useState<Map<string, string>>(new Map()); // sourceEntityId -> code

  // Derive patient list from incoming shares (for doctors)
  const patientList = useMemo(() => {
    const patientMap = new Map<string, { entityId: string; recordCount: number }>();
    
    shares.incoming.forEach((share) => {
      const existing = patientMap.get(share.sourceEntityId);
      if (existing) {
        existing.recordCount += 1;
      } else {
        patientMap.set(share.sourceEntityId, {
          entityId: share.sourceEntityId,
          recordCount: 1,
        });
      }
    });
    
    return Array.from(patientMap.values());
  }, [shares.incoming]);

  // Profile-related state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null); // null = loading
  const profilePropertyKey = `${PropertyKeyPrefixes.PROFILE}data`;

  // Real-time event stream for profile data (encrypted)
  const eventStream = useEventStream(
    signedIn ? entityId : null,
    signedIn ? entityPrivateKey : null
  );

  // Helper to get records for a specific patient (must be after eventStream)
  const getPatientRecords = useCallback((patientEntityId: string) => {
    return eventStream.sharedData.filter(
      (item) => item.sourceEntityId === patientEntityId
    );
  }, [eventStream.sharedData]);

  // Send initial EntityCreated event for new entities
  useEffect(() => {
    if (isNewEntity && eventStream.connected && entityId && eventStream.events.length === 0) {
      eventStream.appendEvent({
        type: "EntityCreated",
        data: { entityId },
      });
      setIsNewEntity(false);
    }
  }, [isNewEntity, eventStream.connected, entityId, eventStream.events.length, eventStream]);

  useEffect(() => {
    setSupportsPasskeys(browserSupportsWebAuthn());
  }, []);

  const entityKeyStorageKey = (id: string) => `${ENTITY_KEY_PREFIX}${id}`;

  const loadWrappedKey = async (id: string): Promise<WrappedKeyRecord | null> => {
    const value = await get(entityKeyStorageKey(id));
    return (value as WrappedKeyRecord | undefined) ?? null;
  };

  const storeWrappedKey = async (id: string, record: WrappedKeyRecord) => {
    await set(entityKeyStorageKey(id), record);
  };

  const clearWrappedKey = async (id: string) => {
    await del(entityKeyStorageKey(id));
  };

  const registerNewPasskey = async (): Promise<string> => {
    const userId = getLocal(USER_ID_KEY) ?? randomBase64Url(16);
    setLocal(USER_ID_KEY, userId);

    const registration = await startRegistration({
      optionsJSON: {
        challenge: randomBase64Url(),
        rp: { name: "MedVault", id: window.location.hostname },
        user: { id: userId, name: "user@medvault.local", displayName: "User" },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 }
        ],
        authenticatorSelection: { residentKey: "required", userVerification: "required" },
        timeout: 60000,
        attestation: "none"
      }
    });

    setLocal(CREDENTIAL_ID_KEY, registration.id);
    return registration.id;
  };

  const hydrateEntity = async (passkeyId: string, allowCreate: boolean, role?: EntityRole) => {
    // Pass role for new entity creation
    const lookup = allowCreate 
      ? await initEntity(passkeyId, role || pendingRoleRef.current || undefined) 
      : await initEntityIfExists(passkeyId);
    if (!lookup.entityId) throw new Error("No entity found.");

    let key: Uint8Array | null = null;
    const stored = await loadWrappedKey(lookup.entityId);
    if (stored) {
      key = await unwrapPrivateKey(stored.wrapped, stored.nonce);
    }

    if (!key && lookup.created) {
      const keyPair = await generateEntityKeyPair();
      key = keyPair.privateKey;
      const wrapped = await wrapPrivateKey(key);
      await storeWrappedKey(lookup.entityId, wrapped);
      setIsNewEntity(true);
    }

    setEntityId(lookup.entityId);
    setEntityRole(lookup.role);
    setEntityPrivateKey(key);
    setSignedIn(true);
    
    // Clear pending role ref
    pendingRoleRef.current = null;
  };

  const loginMutation = useMutation({
    mutationFn: async (role?: EntityRole) => {
      const storedCredentialId = getLocal(CREDENTIAL_ID_KEY);

      let credentialId: string;

      if (storedCredentialId) {
        // User has registered before - authenticate with specific credential
        const auth = await startAuthentication({
          optionsJSON: {
            challenge: randomBase64Url(),
            timeout: 60000,
            userVerification: "required",
            rpId: window.location.hostname,
            allowCredentials: [
              {
                id: storedCredentialId,
                type: "public-key",
                transports: ["internal", "hybrid"]
              }
            ]
          }
        });
        credentialId = auth.id;
        setLocal(CREDENTIAL_ID_KEY, credentialId);
      } else {
        // First time user - store role for later use and register a new passkey
        pendingRoleRef.current = role || null;
        credentialId = await registerNewPasskey();
      }

      await hydrateEntity(credentialId, true, role);
      await createSession(credentialId);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Login failed.");
    }
  });

  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      if (!entityId || !entityPrivateKey) return;
      const code = generateInviteCode();
      const sealed = await sealPrivateKeyForInvite(entityPrivateKey, code);
      const { expiresAt } = await createInvite(entityId, code, sealed);
      setGeneratedInvite({ code, expiresAt });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to generate invite.");
    }
  });

  const linkMutation = useMutation({
    mutationFn: async (code: string) => {
      const passkeyId = getLocal(CREDENTIAL_ID_KEY);
      if (!passkeyId) throw new Error("Missing passkey.");
      const invite = await consumeInvite(code);
      const key = await openSealedPrivateKey(invite.sealed as SealedInvitePayload, code);

      if (entityId && entityId !== invite.entityId) {
        await clearWrappedKey(entityId);
      }

      const wrapped = await wrapPrivateKey(key);
      await storeWrappedKey(invite.entityId, wrapped);
      await linkPasskey(passkeyId, invite.entityId);

      setEntityId(invite.entityId);
      setEntityPrivateKey(key);
      setInviteCode("");
      setGeneratedInvite(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to link device.");
    }
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await resetAll();
      removeLocal(CREDENTIAL_ID_KEY);
      removeLocal(USER_ID_KEY);
      if (entityId) await clearWrappedKey(entityId);
    },
    onSuccess: () => {
      toast.success(
        "App data cleared. To delete passkeys, go to your browser's password settings.",
        { duration: 8000 }
      );
      setSignedIn(false);
      setEntityId(null);
      setEntityRole(null);
      setEntityPrivateKey(null);
      setInviteCode("");
      setGeneratedInvite(null);
      setShares({ outgoing: [], incoming: [] });
      setGeneratedShare(null);
      setUserProfile(null);
      setIsOnboardingComplete(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to reset.");
    }
  });

  // Create a share invite
  const createShareMutation = useMutation({
    mutationFn: async (propertyName: string) => {
      if (!entityId || !entityPrivateKey) throw new Error("Not authenticated");
      const code = generateShareCode();
      const sealedKey = await sealKeyForShare(entityPrivateKey, code);
      const { expiresAt } = await createShare(code, propertyName, sealedKey);
      setGeneratedShare({ code, propertyName, expiresAt });
      // Emit ShareCreated event for audit log
      eventStream.appendEvent({
        type: "ShareCreated",
        data: { propertyName },
      });
      toast.success(`Share code generated for ${propertyName}`);
      return { code, propertyName, expiresAt };
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to create share.");
    }
  });

  // Consume a share invite
  const consumeShareMutation = useMutation({
    mutationFn: async (code: string) => {
      const result = await consumeShare(code);
      // Store the code temporarily so we can decrypt events later
      setPendingShareCodes(prev => new Map(prev).set(result.sourceEntityId, code));
      // Register the key in the event stream
      await eventStream.registerSharedKey(
        result.sourceEntityId,
        result.sealedKey as SealedInvitePayload,
        code
      );
      // Refresh shares list
      const updatedShares = await getShares();
      setShares(updatedShares);
      // Emit ShareAccepted event for audit log
      eventStream.appendEvent({
        type: "ShareAccepted",
        data: { 
          sourceEntityId: result.sourceEntityId,
          propertyName: result.propertyName,
        },
      });
      toast.success(`Now receiving ${result.propertyName} from ${result.sourceEntityId.slice(0, 8)}...`);
      return result;
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to consume share.");
    }
  });

  // Revoke a share
  const revokeShareMutation = useMutation({
    mutationFn: async (params: { targetEntityId?: string; sourceEntityId?: string; propertyName: string }) => {
      const { removed } = await revokeShare(
        params.targetEntityId || null,
        params.sourceEntityId || null,
        params.propertyName
      );
      if (removed) {
        // If revoking incoming share, unregister the key
        if (params.sourceEntityId) {
          eventStream.unregisterSharedKey(params.sourceEntityId);
        }
        // Refresh shares list
        const updatedShares = await getShares();
        setShares(updatedShares);
        // Emit ShareRevoked event for audit log
        const direction = params.sourceEntityId ? "incoming" : "outgoing";
        const entityIdForEvent = params.sourceEntityId || params.targetEntityId || "";
        eventStream.appendEvent({
          type: "ShareRevoked",
          data: {
            entityId: entityIdForEvent,
            propertyName: params.propertyName,
            direction,
          },
        });
        toast.success("Share removed");
      }
      return removed;
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to revoke share.");
    }
  });

  // Transfer records to a patient (doctor only)
  const transferMutation = useMutation({
    mutationFn: async (params: { targetEntityId: string; propertyNames: string[] }) => {
      if (!entityId || !entityPrivateKey) throw new Error("Not authenticated");
      if (entityRole !== "doctor") throw new Error("Only doctors can transfer records");

      const { targetEntityId, propertyNames } = params;
      
      // Decrypt each property and re-encrypt for transfer
      const encryptedPayloads: Record<string, EncryptedPayload> = {};
      const properties = eventStream.state?.properties ?? {};
      
      for (const propertyName of propertyNames) {
        const value = properties[propertyName];
        if (!value) {
          console.warn(`[Transfer] Property ${propertyName} not found, skipping`);
          continue;
        }
        
        // Create encrypted payload for the patient's vault
        // We re-encrypt the PropertySet event data with the patient as the target
        const eventData = {
          type: "PropertySet",
          data: { key: propertyName, value }
        };
        const encrypted = await encryptJson(entityPrivateKey, eventData);
        encryptedPayloads[propertyName] = encrypted;
      }

      if (Object.keys(encryptedPayloads).length === 0) {
        throw new Error("No valid properties to transfer");
      }

      // Create sealed key so we (doctor) can continue reading from patient
      const shareCode = generateShareCode();
      const sealedKey = await sealKeyForShare(entityPrivateKey, shareCode);

      // Call transfer API
      const result = await transferToPatient(
        targetEntityId,
        propertyNames,
        encryptedPayloads,
        sealedKey
      );

      // Delete transferred properties from our vault
      for (const propertyName of result.transferred) {
        eventStream.deleteProperty(propertyName);
        
        // Emit transfer event for audit log
        const record = properties[propertyName];
        let recordTitle = propertyName;
        try {
          const parsed = JSON.parse(record);
          recordTitle = parsed.title || propertyName;
        } catch {}
        
        eventStream.appendEvent({
          type: "RecordTransferred",
          data: {
            recordKey: propertyName,
            toEntityId: targetEntityId,
            recordTitle,
          },
        });
      }

      // Register the shared key so we can read from patient
      if (result.shareCode) {
        setPendingShareCodes(prev => new Map(prev).set(targetEntityId, shareCode));
      }

      // Refresh shares list
      const updatedShares = await getShares();
      setShares(updatedShares);

      toast.success(`Transferred ${result.transferred.length} record(s) to patient`);
      return result;
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to transfer records.");
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const session = await getSession();
      if (!session.passkeyId) return;
      await hydrateEntity(session.passkeyId, false);
    },
    onError: () => {
      void clearSession();
    },
    onSettled: () => setRestoreDone(true)
  });

  // Load shares when signed in
  useEffect(() => {
    if (signedIn && entityId) {
      getShares().then(setShares).catch(console.error);
    }
  }, [signedIn, entityId]);

  // Load profile from properties when available
  useEffect(() => {
    const properties = eventStream.state?.properties ?? {};
    const profileData = properties[profilePropertyKey];
    
    if (profileData) {
      try {
        const parsed = JSON.parse(profileData) as UserProfile;
        setUserProfile(parsed);
        setIsOnboardingComplete(parsed.onboardingComplete);
      } catch {
        setIsOnboardingComplete(false);
      }
    } else if (eventStream.connected && eventStream.state) {
      // Connected but no profile found - onboarding needed
      setIsOnboardingComplete(false);
    }
  }, [eventStream.state?.properties, eventStream.connected, eventStream.state, profilePropertyKey]);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!entityId || !entityPrivateKey) throw new Error("Not authenticated");
      
      // Save encrypted profile to event stream
      const profileJson = JSON.stringify(profile);
      eventStream.setProperty(profilePropertyKey, profileJson);
      
      // Also save public profile to server for graph labels
      let displayName: string;
      let subtitle: string | undefined;
      let organizationName: string | undefined;
      
      if (isProviderProfile(profile)) {
        displayName = getDisplayName(profile);
        subtitle = profile.specialty || undefined;
        organizationName = profile.organizationName || undefined;
      } else if (isPatientProfile(profile)) {
        displayName = getDisplayName(profile);
      } else {
        displayName = "Unknown User";
      }
      
      await savePublicProfile({ displayName, subtitle, organizationName });
      
      setUserProfile(profile);
      setIsOnboardingComplete(profile.onboardingComplete);
      
      toast.success("Profile saved successfully");
      return profile;
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to save profile.");
    }
  });

  // Register keys for incoming shares when we have them
  useEffect(() => {
    shares.incoming.forEach(async (share) => {
      const code = pendingShareCodes.get(share.sourceEntityId);
      if (code) {
        await eventStream.registerSharedKey(
          share.sourceEntityId,
          share.keyWrapped as SealedInvitePayload,
          code
        );
      }
    });
  }, [shares.incoming, pendingShareCodes, eventStream]);

  const isBusy = useMemo(
    () =>
      loginMutation.isPending ||
      generateInviteMutation.isPending ||
      linkMutation.isPending ||
      resetMutation.isPending ||
      createShareMutation.isPending ||
      consumeShareMutation.isPending ||
      revokeShareMutation.isPending ||
      transferMutation.isPending ||
      saveProfileMutation.isPending ||
      (restoreMutation.isPending && !restoreDone),
    [
      loginMutation.isPending,
      generateInviteMutation.isPending,
      linkMutation.isPending,
      resetMutation.isPending,
      createShareMutation.isPending,
      consumeShareMutation.isPending,
      revokeShareMutation.isPending,
      transferMutation.isPending,
      saveProfileMutation.isPending,
      restoreMutation.isPending,
      restoreDone
    ]
  );

  useEffect(() => {
    if (signedIn || restoreAttemptedRef.current) return;
    restoreAttemptedRef.current = true;
    restoreMutation.mutate();
  }, [signedIn, restoreMutation]);

  const login = (role?: EntityRole) => loginMutation.mutateAsync(role);

  const logout = async () => {
    await clearSession();
    setSignedIn(false);
    setEntityId(null);
    setEntityRole(null);
    setEntityPrivateKey(null);
    setInviteCode("");
    setGeneratedInvite(null);
    setUserProfile(null);
    setIsOnboardingComplete(null);
  };

  // Profile action
  const saveProfile = (profile: UserProfile) => saveProfileMutation.mutateAsync(profile);

  const generateInvite = () => generateInviteMutation.mutateAsync();

  const linkDevice = (code: string) => linkMutation.mutateAsync(code.trim().toUpperCase());

  const resetEverything = () => resetMutation.mutateAsync();

  // Share actions
  const createShareInvite = (propertyName: string) => createShareMutation.mutateAsync(propertyName);
  const acceptShare = (code: string) => consumeShareMutation.mutateAsync(code.trim().toUpperCase());
  const removeShare = (params: { targetEntityId?: string; sourceEntityId?: string; propertyName: string }) =>
    revokeShareMutation.mutateAsync(params);

  // Transfer action (doctor only)
  const transferRecords = (targetEntityId: string, propertyNames: string[]) =>
    transferMutation.mutateAsync({ targetEntityId, propertyNames });

  // Record rename - emit event for audit log
  const renameRecord = (key: string, oldName: string, newName: string) => {
    eventStream.appendEvent({
      type: "RecordRenamed",
      data: { key, oldName, newName },
    });
  };

  return {
    signedIn,
    supportsPasskeys,
    entityId,
    entityRole,
    hasKey: !!entityPrivateKey,
    // Entity state comes from real-time event stream
    state: eventStream.state,
    properties: eventStream.state?.properties ?? {},
    connected: eventStream.connected,
    // Event history for audit log
    events: eventStream.events,
    inviteCode,
    setInviteCode,
    generatedInvite,
    isBusy,
    isLoggingIn: loginMutation.isPending,
    isGeneratingInvite: generateInviteMutation.isPending,
    isLinking: linkMutation.isPending,
    isResetting: resetMutation.isPending,
    login,
    logout,
    generateInvite,
    linkDevice,
    resetEverything,
    // Property management
    setProperty: eventStream.setProperty,
    deleteProperty: eventStream.deleteProperty,
    renameRecord,
    // Share-related
    shares,
    sharedData: eventStream.sharedData,
    sharePropertyName,
    setSharePropertyName,
    shareCode,
    setShareCode,
    generatedShare,
    isCreatingShare: createShareMutation.isPending,
    isAcceptingShare: consumeShareMutation.isPending,
    isRevokingShare: revokeShareMutation.isPending,
    createShareInvite,
    acceptShare,
    removeShare,
    // Transfer-related (doctor only)
    isTransferring: transferMutation.isPending,
    transferRecords,
    // Patient management (doctor only)
    patientList,
    getPatientRecords,
    // Profile-related
    userProfile,
    isOnboardingComplete,
    isSavingProfile: saveProfileMutation.isPending,
    saveProfile,
  };
}
