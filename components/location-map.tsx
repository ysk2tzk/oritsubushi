"use client";

import dynamic from "next/dynamic";

const LocationMapClient = dynamic(
  () => import("@/components/location-map-client").then((mod) => mod.LocationMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="stack">
        <div className="inline-meta">
          <span className="pill">地図を読み込み中</span>
        </div>
        <div className="card map-panel">
          <div className="map-frame" />
        </div>
      </div>
    )
  }
);

export function LocationMap() {
  return <LocationMapClient />;
}
