import { NextResponse } from "next/server";

import { 
  removeOutgoingShare, 
  removeIncomingShare, 
  getEntityIdForPasskey,
  getEntityRole,
  getShares
} from "../../_lib/storage";
import { getServerSession } from "../../../lib/session";

type RevokeShareRequest = {
  targetEntityId?: string;
  sourceEntityId?: string;
  propertyName?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session.passkeyId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const entityId = await getEntityIdForPasskey(session.passkeyId);
  if (!entityId) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  const body = (await request.json()) as RevokeShareRequest;
  const propertyName = body.propertyName?.trim();

  if (!propertyName) {
    return NextResponse.json({ error: "propertyName is required" }, { status: 400 });
  }

  const callerRole = await getEntityRole(entityId);
  const callerShares = await getShares(entityId);

  // Revoke outgoing share (I shared with someone)
  if (body.targetEntityId) {
    // Verify the caller actually has this outgoing share (owns the data)
    const hasOutgoingShare = callerShares.outgoing.some(
      s => s.targetEntityId === body.targetEntityId && s.propertyName === propertyName
    );
    
    if (!hasOutgoingShare) {
      return NextResponse.json(
        { error: "You don't have an outgoing share for this record" },
        { status: 403 }
      );
    }

    // For patient-centric model: patients own their data and can revoke
    // Doctors can only revoke shares they created (before transfer)
    // After transfer, only the patient (new owner) can revoke
    
    const removed = await removeOutgoingShare(entityId, body.targetEntityId, propertyName);
    if (removed) {
      // Also remove from their incoming shares
      await removeIncomingShare(body.targetEntityId, entityId, propertyName);
    }
    return NextResponse.json({ removed, revokedBy: callerRole });
  }

  // Revoke incoming share (someone shared with me, I want to stop receiving)
  if (body.sourceEntityId) {
    // Verify the caller actually has this incoming share
    const hasIncomingShare = callerShares.incoming.some(
      s => s.sourceEntityId === body.sourceEntityId && s.propertyName === propertyName
    );
    
    if (!hasIncomingShare) {
      return NextResponse.json(
        { error: "You don't have an incoming share for this record" },
        { status: 403 }
      );
    }

    // Anyone can unlink from data they're receiving
    const removed = await removeIncomingShare(entityId, body.sourceEntityId, propertyName);
    if (removed) {
      // Also remove from their outgoing shares (notify the source)
      await removeOutgoingShare(body.sourceEntityId, entityId, propertyName);
    }
    return NextResponse.json({ removed, unlinkedBy: callerRole });
  }

  return NextResponse.json(
    { error: "Either targetEntityId or sourceEntityId is required" },
    { status: 400 }
  );
}
