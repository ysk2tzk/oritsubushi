import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { HistoryExportButton } from "@/components/history-export-button";

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
              <Link className="button history-top-action" href="/history/prefecture">
                都道府県別
              </Link>
              <HistoryExportButton />
            </div>
          </div>
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
