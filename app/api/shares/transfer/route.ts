import { NextResponse } from "next/server";

import {
  getEntityIdForPasskey,
  getEntityRole,
  addOutgoingShare,
  addIncomingShare,
  addTransferRecord,
  createShare,
  type EntityRole,
} from "../../_lib/storage";
import { getServerSession } from "../../../lib/session";
import { appendEvent, getEventStream, type EncryptedPayload } from "../../../lib/events";
import { getSocketIOServer } from "../../../lib/socket";
import { randomUUID } from "crypto";

type TransferRequest = {
  targetEntityId: string;
  propertyNames: string[];
  encryptedPayloads: Record<string, EncryptedPayload>; // propertyName -> encrypted payload for target's vault
  sealedKeyForSource: unknown; // wrapped key so source (doctor) can continue reading from patient
};

const DEFAULT_SHARE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for auto-share

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session.passkeyId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sourceEntityId = await getEntityIdForPasskey(session.passkeyId);
  if (!sourceEntityId) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  // Verify source is a doctor
  const sourceRole = await getEntityRole(sourceEntityId);
  if (sourceRole !== "doctor") {
    return NextResponse.json(
      { error: "Only healthcare providers can transfer records to patients" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as TransferRequest;
  const { targetEntityId, propertyNames, encryptedPayloads, sealedKeyForSource } = body;

  if (!targetEntityId || !propertyNames || propertyNames.length === 0) {
    return NextResponse.json(
      { error: "targetEntityId and propertyNames are required" },
      { status: 400 }
    );
  }

  if (!encryptedPayloads || Object.keys(encryptedPayloads).length === 0) {
    return NextResponse.json(
      { error: "encryptedPayloads are required" },
      { status: 400 }
    );
  }

  // Verify target is a patient
  const targetRole = await getEntityRole(targetEntityId);
  if (targetRole !== "patient") {
    return NextResponse.json(
      { error: "Records can only be transferred to patients" },
      { status: 403 }
    );
  }

  // Cannot transfer to yourself
  if (sourceEntityId === targetEntityId) {
    return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 });
  }

  const transferred: string[] = [];
  const io = getSocketIOServer();

  // Process each property transfer
  for (const propertyName of propertyNames) {
    const encryptedPayload = encryptedPayloads[propertyName];
    if (!encryptedPayload) {
      console.warn(`[Transfer] Missing encrypted payload for ${propertyName}, skipping`);
      continue;
    }

    try {
      // 1. Append the property to the target (patient's) event stream
      // The client has re-encrypted this with the patient's key
      const savedEvent = await appendEvent(targetEntityId, encryptedPayload);

      // 2. Notify the target entity about the new event
      if (io) {
        io.to(`entity:${targetEntityId}`).emit("event", savedEvent);
      }

      // 3. Mark the property as deleted in the source (doctor's) vault
      // We emit a PropertyDeleted event to the source
      // Note: The client will need to handle this - we just record the transfer
      // The actual deletion event should come from the client with proper encryption

      // 4. Record the transfer for audit
      await addTransferRecord({
        recordKey: propertyName,
        fromEntityId: sourceEntityId,
        toEntityId: targetEntityId,
        transferredAt: new Date().toISOString(),
        autoShareGranted: !!sealedKeyForSource,
      });

      transferred.push(propertyName);
    } catch (err) {
      console.error(`[Transfer] Failed to transfer ${propertyName}:`, err);
    }
  }

  // 5. If sealedKeyForSource is provided, create an auto-share so doctor can still read
  let shareCode: string | null = null;
  if (sealedKeyForSource && transferred.length > 0) {
    shareCode = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
    
    // For each transferred property, set up an outgoing share from patient to doctor
    for (const propertyName of transferred) {
      // Create the share record
      await createShare(shareCode + "_" + propertyName, {
        sourceEntityId: targetEntityId, // Patient is now the source
        propertyName,
        sealedKey: sealedKeyForSource,
        expiresAt: Date.now() + DEFAULT_SHARE_TTL_MS,
      });

      // Register outgoing share on patient's side
      await addOutgoingShare(targetEntityId, {
        targetEntityId: sourceEntityId, // Doctor is now receiving
        propertyName,
      });

      // Register incoming share on doctor's side
      await addIncomingShare(sourceEntityId, {
        sourceEntityId: targetEntityId, // Patient is the source
        propertyName,
        keyWrapped: sealedKeyForSource,
      });
    }
  }

  return NextResponse.json({
    transferred,
    shareCode,
    message: `Transferred ${transferred.length} record(s) to patient`,
  });
}
