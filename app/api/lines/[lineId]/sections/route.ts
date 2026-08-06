import { NextRequest, NextResponse } from "next/server";
import { recordLineSectionsInRange } from "@/lib/domain";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  try {
    const { lineId } = await params;
    const body = (await request.json()) as {
      from_station_id: number;
      to_station_id: number;
      first_achieved_on: string;
    };

    const result = await recordLineSectionsInRange(Number(lineId), {
      fromStationId: body.from_station_id,
      toStationId: body.to_station_id,
      firstAchievedOn: body.first_achieved_on
    });

    return NextResponse.json({ ok: true, updatedCount: result.updatedCount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新に失敗しました。" },
      { status: 500 }
    );
  }
}
