import { NextResponse } from "next/server";

import {
  getEntityIdForPasskey,
  getDataRequest,
  updateDataRequestStatus,
} from "../../_lib/storage";
import { getServerSession } from "../../../lib/session";

type DeclineRequestBody = {
  requestId?: string;
  reason?: string;
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

  const body = (await request.json()) as DeclineRequestBody;
  const requestId = body.requestId?.trim();

  if (!requestId) {
    return NextResponse.json(
      { error: "requestId is required" },
      { status: 400 }
    );
  }

  // Get the request
  const dataRequest = await getDataRequest(requestId);
  if (!dataRequest) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  // Verify the caller is the target of the request
  if (dataRequest.toEntityId !== entityId) {
    return NextResponse.json(
      { error: "You can only decline requests addressed to you" },
      { status: 403 }
    );
  }

  // Verify the request is pending
  if (dataRequest.status !== "pending") {
    return NextResponse.json(
      { error: `Request is already ${dataRequest.status}` },
      { status: 400 }
    );
  }

  // Update the request status
  const updatedRequest = await updateDataRequestStatus(requestId, "declined");

  return NextResponse.json({
    request: updatedRequest,
    // Include socket emission hint for the caller
    socketEvent: {
      type: "requestDeclined",
      toEntityId: dataRequest.fromEntityId,
      request: updatedRequest,
    },
  });
}
