import { NextResponse } from "next/server";

import {
  getEntityIdForPasskey,
  getEntityRole,
  createDataRequest,
  getPublicProfile,
} from "../../_lib/storage";
import { getServerSession } from "../../../lib/session";

type CreateRequestBody = {
  toEntityId?: string;
  requestedTypes?: string[];
  message?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session.passkeyId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const fromEntityId = await getEntityIdForPasskey(session.passkeyId);
  if (!fromEntityId) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  // Only doctors can create data requests
  const role = await getEntityRole(fromEntityId);
  if (role !== "doctor") {
    return NextResponse.json(
      { error: "Only healthcare providers can create data requests" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as CreateRequestBody;
  const toEntityId = body.toEntityId?.trim();
  const requestedTypes = body.requestedTypes;
  const message = body.message?.trim();

  if (!toEntityId) {
    return NextResponse.json(
      { error: "toEntityId is required" },
      { status: 400 }
    );
  }

  if (!requestedTypes || requestedTypes.length === 0) {
    return NextResponse.json(
      { error: "At least one requested type is required" },
      { status: 400 }
    );
  }

  // Verify target entity exists
  const targetProfile = await getPublicProfile(toEntityId);
  if (!targetProfile) {
    return NextResponse.json(
      { error: "Target entity not found" },
      { status: 404 }
    );
  }

  // Create the request
  const dataRequest = await createDataRequest({
    fromEntityId,
    toEntityId,
    requestedTypes,
    message,
  });

  return NextResponse.json({
    request: dataRequest,
    // Include socket emission hint for the caller
    socketEvent: {
      type: "dataRequest",
      toEntityId,
      request: dataRequest,
    },
  });
}
