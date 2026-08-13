import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LocationMap } from "@/components/location-map";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack">
              <Breadcrumbs items={[{ label: "地図を見るTop" }]} />
              <h1 className="hero-title">降りつぶし</h1>
            </div>
          </div>
          <LocationMap />
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
