import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getStationHistoryYearSummaries } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function HistoryDatePage() {
  const { years } = await getStationHistoryYearSummaries();

  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack">
              <Breadcrumbs
                items={[
                  { label: "記録を見るTop", href: "/history" },
                  { label: "年別集計" }
                ]}
              />
              <h1 className="hero-title">年別集計</h1>
            </div>
          </div>

          <div className="grid-list">
            {years.length === 0 ? (
              <div className="card">
                <div className="card-inner">
                  <p className="subtle">年別に表示できる乗降車記録はまだありません。</p>
                </div>
              </div>
            ) : (
              years.map((item) => (
                <Link key={item.key} href={`/history/date/${item.key}`} className="list-link">
                  <strong>{item.label}</strong>
                  <span className="subtle">{item.count}駅</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
