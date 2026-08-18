import { getStationRecordExportSheets } from "@/lib/domain";
import { buildStationRecordWorkbook } from "@/lib/station-record-export";

function formatJstDateForFileName(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .format(date)
    .replace(/\//g, "-");
}

export async function GET() {
  try {
    const sheets = await getStationRecordExportSheets();
    const workbook = await buildStationRecordWorkbook(sheets);
    const buffer = await workbook.xlsx.writeBuffer();
    const fileDate = formatJstDateForFileName(new Date());
    const fileName = `乗降車記録_${fileDate}.xlsx`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "出力に失敗しました。" },
      { status: 500 }
    );
  }
}
