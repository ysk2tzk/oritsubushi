import Link from "next/link";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
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
              <Breadcrumbs
                items={[
                  { label: "記録するTop", href: "/record" },
                  { label: "会社一覧", href: `/record/company-type/${company.company_type}` },
                  { label: "路線一覧", href: `/record/company/${company.id}` },
                  { label: line.name }
                ]}
              />
              <h1 className="hero-title">{line.name}</h1>
              <p className="subtle">{company.name}</p>
              <div>
                <Link href={`/record/line/${line.id}/sections`} className="button">
                  複数区間を記録する
                </Link>
              </div>
            </div>
          </div>
          <div className="timeline">
            {items.map((item, index) =>
              item.type === "station" ? (
                <Link
                  key={`${item.station.id}-${index}`}
                  href={`/stations/${item.station.id}?from=line&lineId=${lineId}&lineName=${encodeURIComponent(line.name)}`}
                  className="station-row"
                >
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
                <Link
                  key={`${item.section.id}-${index}`}
                  href={`/sections/${item.section.id}?from=line&lineId=${lineId}&lineName=${encodeURIComponent(line.name)}`}
                  className="section-row"
                >
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
