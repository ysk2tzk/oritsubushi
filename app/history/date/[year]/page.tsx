import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getStationHistoryMonthSummaries, getStationsByUnknownHistoryYear } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function HistoryYearPage({
  params
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const [{ yearLabel, months }, unknownStations] = await Promise.all([
    getStationHistoryMonthSummaries(year),
    year === "unknown" ? getStationsByUnknownHistoryYear() : Promise.resolve([])
  ]);

  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack">
              <Breadcrumbs
                items={[
                  { label: "記録を見るTop", href: "/history" },
                  { label: "年別集計", href: "/history/date" },
                  { label: yearLabel }
                ]}
              />
              <h1 className="hero-title">{yearLabel}</h1>
            </div>
          </div>
          <div className="grid-list">
            {year === "unknown" ? (
              unknownStations.length === 0 ? (
                <div className="card">
                  <div className="card-inner">
                    <p className="subtle">不明として表示できる乗降車記録はまだありません。</p>
                  </div>
                </div>
              ) : (
                unknownStations.map((station) => (
                  <Link key={station.id} href={`/stations/${station.id}`} className="list-link">
                    <strong>{station.name}</strong>
                    <span className="subtle">{station.companyName}</span>
                  </Link>
                ))
              )
            ) : months.length === 0 ? (
              <div className="card">
                <div className="card-inner">
                  <p className="subtle">月別に表示できる乗降車記録はまだありません。</p>
                </div>
              </div>
            ) : (
              months.map((item) => (
                <Link key={item.key} href={`/history/date/${year}/${item.key}`} className="list-link">
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
