import { NextResponse } from "next/server";

import { 
  getPublicProfile,
  getPublicProfiles,
  getEntityRole,
  type PublicProfileData
} from "../../_lib/storage";

// GET - Fetch public profile(s) for display in graph
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  const entityIds = searchParams.get("entityIds");

  // Single entity lookup
  if (entityId) {
    const profile = await getPublicProfile(entityId);
    const role = await getEntityRole(entityId);
    
    if (!profile && !role) {
      return NextResponse.json({ 
        entityId,
        profile: null 
      });
    }

    // If no profile but role exists, return minimal info
    const result: PublicProfileData = profile || {
      displayName: `Entity ${entityId.slice(0, 8)}...`,
      role: role || "patient",
    };

    return NextResponse.json({ 
      entityId,
      profile: result 
    });
  }

  // Multiple entity lookup
  if (entityIds) {
    const ids = entityIds.split(",").filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ profiles: {} });
    }

    const profiles = await getPublicProfiles(ids);
    
    // Fill in missing profiles with entity role info
    const result: Record<string, PublicProfileData> = {};
    await Promise.all(
      ids.map(async (id) => {
        if (profiles[id]) {
          result[id] = profiles[id]!;
        } else {
          const role = await getEntityRole(id);
          result[id] = {
            displayName: `Entity ${id.slice(0, 8)}...`,
            role: role || "patient",
          };
        }
      })
    );

    return NextResponse.json({ profiles: result });
  }

  return NextResponse.json(
    { error: "entityId or entityIds query parameter is required" },
    { status: 400 }
  );
}
