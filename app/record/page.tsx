import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCompanyTypes } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function RecordPage() {
  const companyTypes = (await getCompanyTypes()).filter((companyType) => companyType.id <= 4);

  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack">
              <Breadcrumbs items={[{ label: "記録するTop" }]} />
              <h1 className="hero-title">降りつぶし</h1>
            </div>
          </div>
          <div className="grid-list">
            {companyTypes.map((companyType) => (
              <Link
                key={companyType.id}
                href={`/record/company-type/${companyType.id}`}
                className="list-link"
              >
                <strong>{companyType.name}</strong>
                <span className="subtle">会社一覧へ</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
