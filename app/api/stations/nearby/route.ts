import { NextRequest, NextResponse } from "next/server";
import { getNearbyStations } from "@/lib/domain";

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lng"));

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ error: "lat と lng が必要です。" }, { status: 400 });
  }

  const stations = await getNearbyStations(latitude, longitude);
  return NextResponse.json({ stations });
}
