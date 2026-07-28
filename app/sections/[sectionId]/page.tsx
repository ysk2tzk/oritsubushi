import { RecordForm } from "@/components/record-form";
import { getSectionRecordContext } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function SectionPage({
  params
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const { section, fromStation, toStation } = await getSectionRecordContext(Number(sectionId));

  return (
    <RecordForm
      endpoint={`/api/sections/${section.id}`}
      title={`${fromStation.name} → ${toStation.name}`}
      noteLabel="備考"
      initialFirstAchievedOn={section.first_achieved_on}
      initialNote={section.note}
      backHref={`/record/line/${section.line_id}`}
    />
  );
}
