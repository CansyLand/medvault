import { NextResponse } from "next/server";

import {
  getEntityIdForPasskey,
  getDataRequestsForEntity,
  getDataRequestsByEntity,
  getEntityRole,
} from "../_lib/storage";
import { getServerSession } from "../../lib/session";

export async function GET() {
  const session = await getServerSession();
  if (!session.passkeyId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const entityId = await getEntityIdForPasskey(session.passkeyId);
  if (!entityId) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  const role = await getEntityRole(entityId);
  
  // Get incoming requests (requests TO this entity) and outgoing requests (requests BY this entity)
  const incoming = await getDataRequestsForEntity(entityId);
  const outgoing = await getDataRequestsByEntity(entityId);

  return NextResponse.json({
    entityId,
    role,
    incoming,
    outgoing,
  });
}
