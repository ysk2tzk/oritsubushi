import { RecordForm } from "@/components/record-form";
import { getSectionRecordContext } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function SectionPage({
  params,
  searchParams
}: {
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<{ from?: string; lineId?: string; lineName?: string }>;
}) {
  const { sectionId } = await params;
  const { from, lineId, lineName } = await searchParams;
  const { section, fromStation, toStation } = await getSectionRecordContext(Number(sectionId));

  return (
    <RecordForm
      endpoint={`/api/sections/${section.id}`}
      title={`${fromStation.name} → ${toStation.name}`}
      noteLabel="備考"
      todayButtonLabel="今日、乗りました"
      initialFirstAchievedOn={section.first_achieved_on}
      initialNote={section.note}
      breadcrumbs={[
        { label: "記録するTop", href: "/record" },
        { label: "会社一覧", href: `/record/company-type/${fromStation.company_id}` },
        { label: "路線一覧", href: `/record/company/${fromStation.company_id}` },
        ...(from === "line" && lineId && lineName
          ? [{ label: lineName, href: `/record/line/${lineId}` }]
          : []),
        { label: `${fromStation.name} → ${toStation.name}` }
      ]}
    />
  );
}
