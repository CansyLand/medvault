export type EntityRole = "doctor" | "patient";

export type InitResponse = {
  entityId: string | null;
  created: boolean;
  role: EntityRole | null;
  publicKey: string | null; // Base64-encoded public key for asymmetric encryption
};

export type InviteConsumeResponse = {
  entityId: string;
  sealed: unknown;
};

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

export async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: 'include', // Ensure cookies are sent
  });
  if (!response.ok) {
    // Try to parse error body for more context
    let errorMessage = `Request failed: ${response.status}`;
    let errorCode: string | undefined;
    try {
      const errorBody = await response.json() as { error?: string; code?: string };
      if (errorBody.error) {
        errorMessage = errorBody.error;
        errorCode = errorBody.code;
      }
    } catch {
      // Body wasn't JSON, use default message
    }
    throw new ApiError(errorMessage, response.status, errorCode);
  }
  return (await response.json()) as T;
}

export async function initEntity(passkeyId: string, role?: EntityRole, publicKey?: string): Promise<InitResponse> {
  return fetchJson<InitResponse>("/api/entities/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passkeyId, createIfMissing: true, role, publicKey })
  });
}

export async function initEntityIfExists(passkeyId: string): Promise<InitResponse> {
  return fetchJson<InitResponse>("/api/entities/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passkeyId, createIfMissing: false })
  });
}

export async function linkPasskey(passkeyId: string, entityId: string) {
  await fetchJson("/api/entities/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passkeyId, entityId })
  });
}

export async function createInvite(
  entityId: string,
  code: string,
  sealed: unknown
): Promise<{ expiresAt: number }> {
  return fetchJson<{ expiresAt: number }>("/api/invites/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityId, code, sealed })
  });
}

export async function consumeInvite(code: string): Promise<InviteConsumeResponse> {
  return fetchJson<InviteConsumeResponse>("/api/invites/consume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
}

export async function resetAll(): Promise<void> {
  await fetchJson("/api/admin/reset", { method: "POST" });
}

export async function createSession(passkeyId: string): Promise<void> {
  await fetchJson("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passkeyId })
  });
}

export async function getSession(): Promise<{ passkeyId: string | null }> {
  return fetchJson<{ passkeyId: string | null }>("/api/session");
}

export async function clearSession(): Promise<void> {
  await fetchJson("/api/session", { method: "DELETE" });
}

// Share types
export type SharesResponse = {
  outgoing: Array<{ targetEntityId: string; propertyName: string }>;
  incoming: Array<{ sourceEntityId: string; propertyName: string; keyWrapped: unknown }>;
};

export type ShareConsumeResponse = {
  sourceEntityId: string;
  propertyName: string;
  sealedKey: unknown;
};

// Share API functions
export async function createShare(
  code: string,
  propertyName: string,
  sealedKey: unknown
): Promise<{ expiresAt: number }> {
  return fetchJson<{ expiresAt: number }>("/api/shares/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, propertyName, sealedKey })
  });
}

export async function consumeShare(code: string): Promise<ShareConsumeResponse> {
  return fetchJson<ShareConsumeResponse>("/api/shares/consume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
}

export async function revokeShare(
  targetEntityId: string | null,
  sourceEntityId: string | null,
  propertyName: string
): Promise<{ removed: boolean }> {
  return fetchJson<{ removed: boolean }>("/api/shares/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetEntityId, sourceEntityId, propertyName })
  });
}

export async function getShares(): Promise<SharesResponse> {
  return fetchJson<SharesResponse>("/api/shares");
}

// Direct share types
export type DirectShareResponse = {
  shared: string[];
  message: string;
};

// Direct share API function - share directly with a connection using public key encryption
export async function createDirectShare(
  targetEntityId: string,
  propertyNames: string[],
  encryptedPayloads: Record<string, unknown>
): Promise<DirectShareResponse> {
  return fetchJson<DirectShareResponse>("/api/shares/direct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetEntityId, propertyNames, encryptedPayloads })
  });
}

// Transfer types
export type TransferRequest = {
  targetEntityId: string;
  propertyNames: string[];
  encryptedPayloads: Record<string, unknown>; // propertyName -> encrypted payload for target
  sealedKeyForSource: unknown; // wrapped key so source (doctor) can continue reading
};

export type TransferResponse = {
  transferred: string[];
  shareCode: string;
};

// Transfer API functions
export async function transferToPatient(
  targetEntityId: string,
  propertyNames: string[],
  encryptedPayloads: Record<string, unknown>,
  sealedKeyForSource: unknown
): Promise<TransferResponse> {
  return fetchJson<TransferResponse>("/api/shares/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetEntityId, propertyNames, encryptedPayloads, sealedKeyForSource })
  });
}

export async function getEntityRole(entityId: string): Promise<EntityRole | null> {
  const response = await fetchJson<{ role: EntityRole | null }>(`/api/entities/role?entityId=${entityId}`);
  return response.role;
}

export async function getEntityPublicKey(entityId: string): Promise<string | null> {
  const response = await fetchJson<{ publicKey: string | null }>(`/api/entities/public-key?entityId=${entityId}`);
  return response.publicKey;
}

export async function updateMyPublicKey(publicKey: string): Promise<void> {
  await fetchJson("/api/entities/public-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey })
  });
}

// Profile types
export type PublicProfile = {
  displayName: string;
  role: EntityRole;
  subtitle?: string;
  organizationName?: string;
};

export type SaveProfileRequest = {
  displayName: string;
  subtitle?: string;
  organizationName?: string;
};

// Profile API functions
export async function savePublicProfile(profile: SaveProfileRequest): Promise<{ success: boolean; profile: PublicProfile }> {
  return fetchJson<{ success: boolean; profile: PublicProfile }>("/api/entities/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile)
  });
}

export async function getPublicProfile(entityId: string): Promise<PublicProfile | null> {
  const response = await fetchJson<{ entityId: string; profile: PublicProfile | null }>(
    `/api/entities/public-profile?entityId=${entityId}`
  );
  return response.profile;
}

export async function getPublicProfiles(entityIds: string[]): Promise<Record<string, PublicProfile>> {
  if (entityIds.length === 0) return {};
  const response = await fetchJson<{ profiles: Record<string, PublicProfile> }>(
    `/api/entities/public-profile?entityIds=${entityIds.join(",")}`
  );
  return response.profiles;
}

// Data Request types
export type DataRequestStatus = "pending" | "fulfilled" | "declined";

export type DataRequest = {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  requestedTypes: string[];
  message?: string;
  status: DataRequestStatus;
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string;
  declinedAt?: string;
};

export type DataRequestsResponse = {
  entityId: string;
  role: EntityRole | null;
  incoming: DataRequest[];
  outgoing: DataRequest[];
};

export type CreateDataRequestResponse = {
  request: DataRequest;
  socketEvent: {
    type: string;
    toEntityId: string;
    request: DataRequest;
  };
};

export type FulfillDataRequestResponse = {
  request: DataRequest;
  sharedPropertyNames: string[];
  socketEvent: {
    type: string;
    toEntityId: string;
    request: DataRequest;
  };
};

export type DeclineDataRequestResponse = {
  request: DataRequest;
  socketEvent: {
    type: string;
    toEntityId: string;
    request: DataRequest;
  };
};

// Data Request API functions
export async function getDataRequests(): Promise<DataRequestsResponse> {
  return fetchJson<DataRequestsResponse>("/api/requests");
}

export async function createDataRequest(
  toEntityId: string,
  requestedTypes: string[],
  message?: string
): Promise<CreateDataRequestResponse> {
  return fetchJson<CreateDataRequestResponse>("/api/requests/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toEntityId, requestedTypes, message })
  });
}

export async function fulfillDataRequest(
  requestId: string,
  sharedPropertyNames?: string[]
): Promise<FulfillDataRequestResponse> {
  return fetchJson<FulfillDataRequestResponse>("/api/requests/fulfill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, sharedPropertyNames })
  });
}

export async function declineDataRequest(
  requestId: string,
  reason?: string
): Promise<DeclineDataRequestResponse> {
  return fetchJson<DeclineDataRequestResponse>("/api/requests/decline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, reason })
  });
}
