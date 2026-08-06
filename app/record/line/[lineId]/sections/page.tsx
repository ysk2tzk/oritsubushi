import { MultiSectionRecordForm } from "@/components/multi-section-record-form";
import { getCompany, getLine, getOrderedLinePath } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function LineSectionsPage({
  params
}: {
  params: Promise<{ lineId: string }>;
}) {
  const { lineId } = await params;
  const lineIdNumber = Number(lineId);
  const [line, { stations }] = await Promise.all([
    getLine(lineIdNumber),
    getOrderedLinePath(lineIdNumber)
  ]);
  const company = await getCompany(line.company_id);

  return (
    <MultiSectionRecordForm
      endpoint={`/api/lines/${line.id}/sections`}
      title="複数区間記録"
      stations={stations.map((station) => ({ id: station.id, name: station.name }))}
      breadcrumbs={[
        { label: "記録するTop", href: "/record" },
        { label: "会社一覧", href: `/record/company-type/${company.company_type}` },
        { label: "路線一覧", href: `/record/company/${company.id}` },
        { label: line.name, href: `/record/line/${line.id}` },
        { label: "複数区間記録" }
      ]}
    />
  );
}
