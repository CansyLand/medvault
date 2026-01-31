import { NextResponse } from "next/server";

import { 
  getEntityIdForPasskey, 
  getEntityRole,
  setPublicProfile,
  type PublicProfileData
} from "../../_lib/storage";
import { getServerSession } from "../../../lib/session";

type SaveProfileRequest = {
  displayName: string;
  subtitle?: string;
  organizationName?: string;
};

// POST - Save profile (public portion stored on server)
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session.passkeyId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const entityId = await getEntityIdForPasskey(session.passkeyId);
  if (!entityId) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  const role = await getEntityRole(entityId);
  if (!role) {
    return NextResponse.json({ error: "Entity role not found" }, { status: 404 });
  }

  const body = (await request.json()) as SaveProfileRequest;
  
  if (!body.displayName || body.displayName.trim().length === 0) {
    return NextResponse.json({ error: "displayName is required" }, { status: 400 });
  }

  const publicProfile: PublicProfileData = {
    displayName: body.displayName.trim(),
    role,
    subtitle: body.subtitle?.trim(),
    organizationName: body.organizationName?.trim(),
  };

  await setPublicProfile(entityId, publicProfile);

  return NextResponse.json({ 
    success: true, 
    profile: publicProfile 
  });
}
