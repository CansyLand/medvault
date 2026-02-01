import { NextResponse } from "next/server";

import { getEntityPublicKey, setEntityPublicKey, getEntityIdForPasskey } from "../../_lib/storage";
import { getServerSession } from "../../../lib/session";

export async function GET(request: Request) {
  // Require authentication to fetch public keys
  const session = await getServerSession();
  if (!session.passkeyId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");

  if (!entityId) {
    return NextResponse.json({ error: "entityId is required" }, { status: 400 });
  }

  const publicKey = await getEntityPublicKey(entityId);
  return NextResponse.json({ publicKey });
}

// POST to update public key for the authenticated user's entity
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session.passkeyId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const entityId = await getEntityIdForPasskey(session.passkeyId);
  if (!entityId) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  const body = await request.json() as { publicKey?: string };
  const publicKey = body.publicKey?.trim();

  if (!publicKey) {
    return NextResponse.json({ error: "publicKey is required" }, { status: 400 });
  }

  await setEntityPublicKey(entityId, publicKey);
  return NextResponse.json({ success: true });
}
