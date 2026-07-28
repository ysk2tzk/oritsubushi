import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { formatFirstAchievedOn } from "@/lib/date-code";
import { getLineTimeline } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function LinePage({
  params
}: {
  params: Promise<{ lineId: string }>;
}) {
  const { lineId } = await params;
  const { company, line, items } = await getLineTimeline(Number(lineId));

  return (
    <>
      <main className="shell">
        <div className="stack">
          <div className="card line-header-card">
            <div className="card-inner stack line-header">
              <h1 className="hero-title">{line.name}</h1>
              <p className="subtle">{company.name}</p>
            </div>
          </div>
          <div className="timeline">
            {items.map((item, index) =>
              item.type === "station" ? (
                <Link key={`${item.station.id}-${index}`} href={`/stations/${item.station.id}`} className="station-row">
                  <div>
                    <strong>{item.station.name}</strong>
                    {item.station.note ? <div className="subtle">{item.station.note}</div> : null}
                  </div>
                  <span className={item.station.first_achieved_on ? "badge-done" : "badge-undone"}>
                    {item.station.first_achieved_on
                      ? formatFirstAchievedOn(item.station.first_achieved_on)
                      : "未乗降車"}
                  </span>
                </Link>
              ) : (
                <Link key={`${item.section.id}-${index}`} href={`/sections/${item.section.id}`} className="section-row">
                  <span className="section-arrow" aria-hidden="true">
                    ↓
                  </span>
                  <div className="section-body">
                    <strong>
                      {item.section.distance === null ? "距離未公表" : `${item.section.distance} km`}
                    </strong>
                    <span className={item.section.first_achieved_on ? "badge-done" : "badge-undone"}>
                      {item.section.first_achieved_on
                        ? formatFirstAchievedOn(item.section.first_achieved_on)
                        : "未乗降車"}
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
