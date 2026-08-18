import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getStationsByHistoryPrefecture } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function HistoryPrefectureStationsPage({
  params
}: {
  params: Promise<{ prefecture: string }>;
}) {
  const { prefecture } = await params;
  const decodedPrefecture = decodeURIComponent(prefecture);
  const { prefectureLabel, achievedCount, totalCount, stations } =
    await getStationsByHistoryPrefecture(decodedPrefecture);

  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack prefecture-header-card">
              <Breadcrumbs
                items={[
                  { label: "記録を見るTop", href: "/history" },
                  { label: "都道府県別", href: "/history/prefecture" },
                  { label: prefectureLabel }
                ]}
              />
              <h1 className="hero-title">{prefectureLabel}</h1>
              <p className="subtle prefecture-header-count">
                {achievedCount}駅 / {totalCount}駅
              </p>
            </div>
          </div>
          <div className="grid-list">
            {stations.length === 0 ? (
              <div className="card">
                <div className="card-inner">
                  <p className="subtle">この都道府県で表示できる駅はまだありません。</p>
                </div>
              </div>
            ) : (
              stations.map((station) => (
                <Link
                  key={station.id}
                  href={`/stations/${station.id}`}
                  className={`list-link station-status-card ${
                    station.isAchieved ? "station-status-card-achieved" : "station-status-card-pending"
                  }`}
                >
                  <div className="station-status-header">
                    <div className="station-title-row">
                      <strong>{station.name}</strong>
                      {station.isShinkansen ? <span className="station-chip">新幹線</span> : null}
                    </div>
                    <span
                      className={`station-status-badge ${
                        station.isAchieved ? "station-status-badge-achieved" : "station-status-badge-pending"
                      }`}
                    >
                      {station.isAchieved ? "済" : "未"}
                    </span>
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
