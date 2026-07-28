import { NextRequest, NextResponse } from "next/server";
import { updateStationRecord } from "@/lib/domain";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  try {
    const { stationId } = await params;
    const body = (await request.json()) as {
      first_achieved_on: string | null;
      note: string | null;
    };

    await updateStationRecord(Number(stationId), {
      first_achieved_on: body.first_achieved_on,
      note: body.note?.trim() || null
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新に失敗しました。" },
      { status: 500 }
    );
  }
}
