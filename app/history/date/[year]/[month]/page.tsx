import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getStationHistoryDaySummaries, getStationsByHistoryDate } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function HistoryMonthPage({
  params
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year, month } = await params;
  const [{ yearLabel, monthLabel, days }, unknownMonthStations] = await Promise.all([
    getStationHistoryDaySummaries(year, month),
    month === "unknown" ? getStationsByHistoryDate(year, month, "unknown") : Promise.resolve(null)
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
                  { label: yearLabel, href: `/history/date/${year}` },
                  { label: monthLabel }
                ]}
              />
              <h1 className="hero-title">{monthLabel}</h1>
            </div>
          </div>
          <div className="grid-list">
            {month === "unknown" ? (
              !unknownMonthStations || unknownMonthStations.stations.length === 0 ? (
                <div className="card">
                  <div className="card-inner">
                    <p className="subtle">不明として表示できる乗降車記録はまだありません。</p>
                  </div>
                </div>
              ) : (
                unknownMonthStations.stations.map((station) => (
                  <Link key={station.id} href={`/stations/${station.id}`} className="list-link">
                    <strong>{station.name}</strong>
                    <span className="subtle">{station.companyName}</span>
                  </Link>
                ))
              )
            ) : days.length === 0 ? (
              <div className="card">
                <div className="card-inner">
                  <p className="subtle">日別に表示できる乗降車記録はまだありません。</p>
                </div>
              </div>
            ) : (
              days.map((item) => (
                <Link key={item.key} href={`/history/date/${year}/${month}/${item.key}`} className="list-link">
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
