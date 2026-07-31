"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { NearbyStation } from "@/lib/domain";
import { formatFirstAchievedOn } from "@/lib/date-code";

type LocationState =
  | { status: "loading"; stations: NearbyStation[] }
  | { status: "ready"; latitude: number; longitude: number; stations: NearbyStation[] }
  | { status: "error"; message: string };

function FitMarkers({ stations }: { stations: NearbyStation[] }) {
  const map = useMap();

  useEffect(() => {
    if (stations.length === 0) {
      return;
    }

    const bounds = stations
      .filter((station) => station.latitude !== null && station.longitude !== null)
      .map((station) => [Number(station.latitude), Number(station.longitude)] as [number, number]);

    if (bounds.length === 0) {
      return;
    }

    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
  }, [map, stations]);

  return null;
}

export function LocationMapClient() {
  const [state, setState] = useState<LocationState>({
    status: "loading",
    stations: []
  });
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [groupIndexes, setGroupIndexes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        status: "error",
        message: "この端末では位置情報を取得できません。"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const response = await fetch(`/api/stations/nearby?lat=${latitude}&lng=${longitude}`);
          if (!response.ok) {
            throw new Error("周辺駅の取得に失敗しました。");
          }
          const result = (await response.json()) as { stations: NearbyStation[] };
          setState({ status: "ready", latitude, longitude, stations: result.stations });
        } catch (error) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "周辺駅の取得に失敗しました。"
          });
        }
      },
      () => {
        setState({
          status: "error",
          message: "位置情報の利用が拒否されました。"
        });
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const stations = state.status === "ready" ? state.stations : [];
  const stationGroups = useMemo(() => {
    const groups = new Map<string, NearbyStation[]>();

    for (const station of stations) {
      if (station.latitude === null || station.longitude === null) {
        continue;
      }

      const key = `${station.latitude}:${station.longitude}`;
      const group = groups.get(key);
      if (group) {
        group.push(station);
      } else {
        groups.set(key, [station]);
      }
    }

    return Array.from(groups.entries()).map(([key, groupedStations]) => ({
      key,
      stations: groupedStations,
      latitude: Number(groupedStations[0].latitude),
      longitude: Number(groupedStations[0].longitude)
    }));
  }, [stations]);

  const selectedStation = useMemo(() => {
    if (!selectedGroupKey) {
      return null;
    }

    const group = stationGroups.find((entry) => entry.key === selectedGroupKey);
    if (!group) {
      return null;
    }

    const index = groupIndexes[selectedGroupKey] ?? 0;
    return group.stations[index] ?? group.stations[0] ?? null;
  }, [groupIndexes, selectedGroupKey, stationGroups]);

  if (state.status === "loading") {
    return (
      <div className="stack">
        <div className="inline-meta">
          <span className="pill">現在地を取得中</span>
        </div>
        <div className="card">
          <div className="card-inner">
            <p className="subtle">位置情報の取得が完了すると周辺駅の地図を表示します。</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="stack">
        <div className="inline-meta">
          <span className="pill">{state.message}</span>
        </div>
        <div className="card">
          <div className="card-inner">
            <p className="subtle">位置情報を利用できないため、地図を表示できません。</p>
          </div>
        </div>
      </div>
    );
  }

  const mapCenter: [number, number] = [state.latitude, state.longitude];

  return (
    <div className="stack">
      <div className="card map-panel">
        <MapContainer center={mapCenter} zoom={13} className="map-frame" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMarkers stations={stations} />
          {stationGroups.map((group) => {
            const index = groupIndexes[group.key] ?? 0;
            const station = group.stations[index] ?? group.stations[0];

            return (
              <CircleMarker
                key={group.key}
                center={[group.latitude, group.longitude]}
                eventHandlers={{
                  click: () => {
                    setSelectedGroupKey(group.key);
                    setGroupIndexes((current) => {
                      const nextIndex =
                        selectedGroupKey === group.key
                          ? ((current[group.key] ?? 0) + 1) % group.stations.length
                          : 0;
                      return {
                        ...current,
                        [group.key]: nextIndex
                      };
                    });
                  }
                }}
                pathOptions={{
                  color: station.first_achieved_on ? "#2563eb" : "#dc2626",
                  fillColor: station.first_achieved_on ? "#2563eb" : "#dc2626",
                  fillOpacity: 0.9
                }}
                radius={10}
              >
                <Popup>
                  <strong>{station.name}</strong>
                  <div>{station.company_name}</div>
                  {station.note ? <div>備考: {station.note}</div> : null}
                  {group.stations.length > 1 ? (
                    <div className="popup-warning">同位置に {group.stations.length} 駅あります。タップで切替。</div>
                  ) : null}
                  <Link className="popup-link" href={`/stations/${station.id}?from=nearby`}>
                    乗降車記録へ
                  </Link>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      {selectedStation ? (
        <div className="grid-list">
          <Link className="list-link nearby-station-card" href={`/stations/${selectedStation.id}?from=nearby`}>
            <strong className="nearby-station-name">{selectedStation.name}</strong>
            <div className="nearby-record">
              <div className="nearby-record-row">
                <span className="nearby-record-label">会社名:</span>
                <span>{selectedStation.company_name}</span>
              </div>
              <div className="nearby-record-row">
                <span className="nearby-record-label">初乗降車日:</span>
                <span>
                  {selectedStation.first_achieved_on
                    ? formatFirstAchievedOn(selectedStation.first_achieved_on)
                    : "未達成"}
                </span>
              </div>
              <div className="nearby-record-row">
                <span className="nearby-record-label">備考:</span>
                <span>{selectedStation.note ? selectedStation.note : "なし"}</span>
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="card-inner">
            <p className="subtle">ピンをタップすると駅情報を表示します。</p>
          </div>
        </div>
      )}
    </div>
  );
}
