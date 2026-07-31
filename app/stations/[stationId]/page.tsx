import { RecordForm } from "@/components/record-form";
import { getStationRecordContext } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function StationPage({
  params,
  searchParams
}: {
  params: Promise<{ stationId: string }>;
  searchParams: Promise<{ from?: string; lineId?: string; lineName?: string }>;
}) {
  const { stationId } = await params;
  const { from, lineId, lineName } = await searchParams;
  const { station, company } = await getStationRecordContext(Number(stationId));
  const breadcrumbs =
    from === "nearby"
      ? [
          { label: "記録するTop", href: "/record" },
          { label: station.name }
        ]
      : [
          { label: "記録するTop", href: "/record" },
          { label: "会社一覧", href: `/record/company-type/${company.company_type}` },
          { label: "路線一覧", href: `/record/company/${company.id}` },
          ...(lineId && lineName
            ? [{ label: lineName, href: `/record/line/${lineId}` }]
            : []),
          { label: station.name }
        ];

  return (
    <RecordForm
      endpoint={`/api/stations/${station.id}`}
      title={station.name}
      subtitle={company.name}
      noteLabel="備考"
      initialFirstAchievedOn={station.first_achieved_on}
      initialNote={station.note}
      breadcrumbs={breadcrumbs}
    />
  );
}
