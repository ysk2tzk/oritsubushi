import { BottomTabs } from "@/components/bottom-tabs";

export default function HistoryPlaceholderPage() {
  return (
    <>
      <main className="shell">
        <div className="card">
          <div className="card-inner stack">
            <span className="pill">記録を見る</span>
            <h1 className="hero-title">閲覧機能はフェーズ保留です。</h1>
            <p className="subtle">
              タブは残し、詳細な閲覧機能は後続フェーズで実装する前提にしています。
            </p>
          </div>
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
