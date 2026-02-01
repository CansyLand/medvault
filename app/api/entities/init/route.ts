import { NextResponse } from "next/server";

import {
  createEntity,
  getEntityIdForPasskey,
  getEntityRole,
  getEntityPublicKey,
  linkPasskeyToEntity,
  setEntityRole,
  setEntityPublicKey,
  entityExists,
  type EntityRole
} from "../../_lib/storage";

type InitRequest = {
  passkeyId?: string;
  createIfMissing?: boolean;
  role?: EntityRole;
  publicKey?: string; // Base64-encoded public key for asymmetric encryption
};

export async function POST(request: Request) {
  const body = (await request.json()) as InitRequest;
  const passkeyId = body.passkeyId?.trim();
  if (!passkeyId) {
    return NextResponse.json({ error: "passkeyId is required" }, { status: 400 });
  }

  const existingEntityId = await getEntityIdForPasskey(passkeyId);
  if (existingEntityId) {
    // Verify the entity directory actually exists (handles stale passkey mappings)
    const exists = await entityExists(existingEntityId);
    if (exists) {
      const role = await getEntityRole(existingEntityId);
      const publicKey = await getEntityPublicKey(existingEntityId);
      return NextResponse.json({ entityId: existingEntityId, created: false, role, publicKey });
    }
    // Entity directory was deleted but mapping remains - treat as non-existent
    console.warn(`[Init] Stale passkey mapping found for ${passkeyId} -> ${existingEntityId}`);
  }

  if (body.createIfMissing === false) {
    return NextResponse.json({ entityId: null, created: false, role: null, publicKey: null });
  }

  const entityId = await createEntity();
  await linkPasskeyToEntity(passkeyId, entityId);
  
  // Set role if provided (required for new entities)
  const role = body.role || "patient"; // Default to patient if not specified
  await setEntityRole(entityId, role);
  
  // Store public key if provided (for asymmetric encryption in transfers)
  if (body.publicKey) {
    await setEntityPublicKey(entityId, body.publicKey);
  }
  
  return NextResponse.json({ entityId, created: true, role, publicKey: body.publicKey || null });
}
