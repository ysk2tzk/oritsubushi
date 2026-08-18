import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getStationsByHistoryDate } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function HistoryDayPage({
  params
}: {
  params: Promise<{ year: string; month: string; day: string }>;
}) {
  const { year, month, day } = await params;
  const { yearLabel, monthLabel, dayLabel, stations } = await getStationsByHistoryDate(year, month, day);

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
                  { label: monthLabel, href: `/history/date/${year}/${month}` },
                  { label: dayLabel }
                ]}
              />
              <h1 className="hero-title">{dayLabel}</h1>
            </div>
          </div>
          <div className="grid-list">
            {stations.length === 0 ? (
              <div className="card">
                <div className="card-inner">
                  <p className="subtle">この条件で表示できる駅はまだありません。</p>
                </div>
              </div>
            ) : (
              stations.map((station) => (
                <Link
                  key={station.id}
                  href={`/stations/${station.id}`}
                  className="list-link station-status-card station-status-card-achieved"
                >
                  <div className="station-title-row">
                    <strong>{station.name}</strong>
                    {station.isShinkansen ? <span className="station-chip">新幹線</span> : null}
                  </div>
                  <div className="station-meta-row">
                    <span className="subtle">{station.companyName}</span>
                  </div>
                  {station.note ? <span className="subtle">{`note: ${station.note}`}</span> : null}
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
