import { NextResponse } from "next/server";

import {
  createEntity,
  getEntityIdForPasskey,
  getEntityRole,
  linkPasskeyToEntity,
  setEntityRole,
  type EntityRole
} from "../../_lib/storage";

type InitRequest = {
  passkeyId?: string;
  createIfMissing?: boolean;
  role?: EntityRole;
};

export async function POST(request: Request) {
  const body = (await request.json()) as InitRequest;
  const passkeyId = body.passkeyId?.trim();
  if (!passkeyId) {
    return NextResponse.json({ error: "passkeyId is required" }, { status: 400 });
  }

  const existingEntityId = await getEntityIdForPasskey(passkeyId);
  if (existingEntityId) {
    const role = await getEntityRole(existingEntityId);
    return NextResponse.json({ entityId: existingEntityId, created: false, role });
  }

  if (body.createIfMissing === false) {
    return NextResponse.json({ entityId: null, created: false, role: null });
  }

  const entityId = await createEntity();
  await linkPasskeyToEntity(passkeyId, entityId);
  
  // Set role if provided (required for new entities)
  const role = body.role || "patient"; // Default to patient if not specified
  await setEntityRole(entityId, role);
  
  return NextResponse.json({ entityId, created: true, role });
}
