import { BottomTabs } from "@/components/bottom-tabs";
import { LocationMap } from "@/components/location-map";
import { getNearbyStations } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialStations = await getNearbyStations(35.681236, 139.767125);

  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack">
              <h1 className="hero-title">降りつぶし</h1>
            </div>
          </div>
          <LocationMap initialStations={initialStations} />
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
