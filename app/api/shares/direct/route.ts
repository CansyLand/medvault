import { NextResponse } from "next/server";

import {
  getEntityIdForPasskey,
  addOutgoingShare,
  addIncomingShare,
} from "../../_lib/storage";
import { getServerSession } from "../../../lib/session";
import { appendEvent, type EncryptedPayload } from "../../../lib/events";
import { getSocketIOServer } from "../../../lib/socket";

type DirectShareRequest = {
  targetEntityId: string;
  propertyNames: string[];
  encryptedPayloads: Record<string, EncryptedPayload>; // propertyName -> encrypted payload for target's vault
};

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session.passkeyId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sourceEntityId = await getEntityIdForPasskey(session.passkeyId);
  if (!sourceEntityId) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  const body = (await request.json()) as DirectShareRequest;
  const { targetEntityId, propertyNames, encryptedPayloads } = body;

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

  // Cannot share with yourself
  if (sourceEntityId === targetEntityId) {
    return NextResponse.json({ error: "Cannot share with yourself" }, { status: 400 });
  }

  const shared: string[] = [];
  const io = getSocketIOServer();

  // Process each property share
  for (const propertyName of propertyNames) {
    const encryptedPayload = encryptedPayloads[propertyName];
    if (!encryptedPayload) {
      console.warn(`[DirectShare] Missing encrypted payload for ${propertyName}, skipping`);
      continue;
    }

    try {
      // 1. Append the property to the target's event stream
      // The client has encrypted this with the target's public key
      const savedEvent = await appendEvent(targetEntityId, encryptedPayload);

      // 2. Notify the target entity about the new event via Socket.IO
      if (io) {
        io.to(`entity:${targetEntityId}`).emit("event", savedEvent);
      }

      // 3. Register outgoing share on source's side
      await addOutgoingShare(sourceEntityId, {
        targetEntityId,
        propertyName,
      });

      // 4. Register incoming share on target's side
      // Note: For direct shares, we don't use keyWrapped since the data is
      // encrypted directly with the target's public key - they can decrypt with their private key
      await addIncomingShare(targetEntityId, {
        sourceEntityId,
        propertyName,
        keyWrapped: null, // Not needed for asymmetric encryption
      });

      shared.push(propertyName);
    } catch (err) {
      console.error(`[DirectShare] Failed to share ${propertyName}:`, err);
    }
  }

  return NextResponse.json({
    shared,
    message: `Shared ${shared.length} record(s) with ${targetEntityId.slice(0, 8)}...`,
  });
}
