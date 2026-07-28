import { RecordForm } from "@/components/record-form";
import { getStationRecordContext } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function StationPage({
  params,
  searchParams
}: {
  params: Promise<{ stationId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { stationId } = await params;
  const { from } = await searchParams;
  const { station, company } = await getStationRecordContext(Number(stationId));
  const backHref = from === "nearby" ? "/" : `/record/company/${company.id}`;

  return (
    <RecordForm
      endpoint={`/api/stations/${station.id}`}
      title={station.name}
      subtitle={company.name}
      noteLabel="備考"
      initialFirstAchievedOn={station.first_achieved_on}
      initialNote={station.note}
      backHref={backHref}
    />
  );
}
