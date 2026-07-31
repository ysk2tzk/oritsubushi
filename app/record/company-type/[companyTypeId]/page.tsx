import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCompaniesByType, getCompanyTypes } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function CompanyTypePage({
  params
}: {
  params: Promise<{ companyTypeId: string }>;
}) {
  const { companyTypeId } = await params;
  const typeId = Number(companyTypeId);
  const [companyTypes, companies] = await Promise.all([
    getCompanyTypes(),
    getCompaniesByType(typeId)
  ]);
  const companyType = companyTypes.find((item) => item.id === typeId);

  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack">
              <Breadcrumbs
                items={[
                  { label: "記録するTop", href: "/record" },
                  { label: "会社一覧" }
                ]}
              />
              <h1 className="hero-title">{companyType?.name ?? "会社種別"}</h1>
              <p className="subtle">会社を選ぶと、対象会社の路線一覧へ進みます。</p>
            </div>
          </div>
          <div className="grid-list">
            {companies.map((company) => (
              <Link key={company.id} href={`/record/company/${company.id}`} className="list-link">
                <strong>{company.name}</strong>
                <span className="subtle">{company.note || "路線一覧へ"}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
