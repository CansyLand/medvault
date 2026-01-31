import { NextResponse } from "next/server";

import { getEntityRole } from "../../_lib/storage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  
  if (!entityId) {
    return NextResponse.json({ error: "entityId is required" }, { status: 400 });
  }

  const role = await getEntityRole(entityId);
  return NextResponse.json({ role });
}
