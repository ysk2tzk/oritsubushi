import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCompany, getLinesByCompany } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function CompanyPage({
  params
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const id = Number(companyId);
  const [company, lines] = await Promise.all([getCompany(id), getLinesByCompany(id)]);

  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack">
              <Breadcrumbs
                items={[
                  { label: "記録するTop", href: "/record" },
                  { label: "会社一覧", href: `/record/company-type/${company.company_type}` },
                  { label: "路線一覧" }
                ]}
              />
              <h1 className="hero-title">{company.name}</h1>
              <p className="subtle">路線を選ぶと、駅と区間を並べた記録画面に進みます。</p>
            </div>
          </div>
          <div className="grid-list">
            {lines.map((line) => (
              <Link key={line.id} href={`/record/line/${line.id}`} className="list-link">
                <strong>{line.name}</strong>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
