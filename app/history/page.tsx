import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function HistoryTopPage() {
  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack">
              <Breadcrumbs items={[{ label: "記録を見るTop" }]} />
              <h1 className="hero-title">降りつぶし</h1>
            </div>
          </div>
          <div className="card">
            <div className="card-inner history-top-actions">
              <Link className="button history-top-action" href="/history/date">
                日付別
              </Link>
              <button className="ghost-button history-top-action" type="button" disabled>
                都道府県別
              </button>
              <button className="ghost-button history-top-action" type="button" disabled>
                乗降車記録出力
              </button>
            </div>
          </div>
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
