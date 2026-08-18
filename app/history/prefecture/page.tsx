import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getStationHistoryPrefectureSummaries } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function HistoryPrefecturePage() {
  const { prefectures } = await getStationHistoryPrefectureSummaries();
  const achievedCount = prefectures.reduce((sum, prefecture) => sum + prefecture.achievedCount, 0);
  const totalCount = prefectures.reduce((sum, prefecture) => sum + prefecture.totalCount, 0);

  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack">
              <Breadcrumbs
                items={[
                  { label: "記録を見るTop", href: "/history" },
                  { label: "都道府県別" }
                ]}
              />
              <h1 className="hero-title">都道府県別</h1>
              <p className="subtle prefecture-header-count">
                {achievedCount}駅 / {totalCount}駅
              </p>
            </div>
          </div>

          <div className="grid-list">
            {prefectures.length === 0 ? (
              <div className="card">
                <div className="card-inner">
                  <p className="subtle">都道府県別に表示できる駅はまだありません。</p>
                </div>
              </div>
            ) : (
              prefectures.map((item) => (
                <Link
                  key={item.key}
                  href={`/history/prefecture/${item.key}`}
                  className="list-link"
                >
                  <strong>{item.label}</strong>
                  <span className="subtle">
                    {item.achievedCount}駅 / {item.totalCount}駅
                  </span>
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
