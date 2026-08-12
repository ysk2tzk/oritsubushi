"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet";
import type { NearbyStation } from "@/lib/domain";
import { formatFirstAchievedOn } from "@/lib/date-code";

type LocationState =
  | { status: "loading"; stations: NearbyStation[] }
  | { status: "ready"; latitude: number; longitude: number; stations: NearbyStation[] }
  | { status: "error"; message: string };

type VisibleGroup = {
  key: string;
  stations: NearbyStation[];
  latitude: number;
  longitude: number;
};

type Bounds = any;

type MapEventsProps = {
  onBoundsChange: (bounds: Bounds) => void;
  onRequestNearby: (center: { lat: number; lng: number }) => void;
};

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function computeVisible(groups: VisibleGroup[], bounds: Bounds) {
  if (!bounds) return [];

  const isLeafletBounds = typeof bounds.getSouthWest === "function" && typeof bounds.getNorthEast === "function";
  const sw = isLeafletBounds ? bounds.getSouthWest() : { lat: bounds[0][0], lng: bounds[0][1] };
  const ne = isLeafletBounds ? bounds.getNorthEast() : { lat: bounds[1][0], lng: bounds[1][1] };

  const inBounds = groups.filter((group) => {
    const lat = group.latitude;
    const lng = group.longitude;
    return lat >= sw.lat && lat <= ne.lat && lng >= sw.lng && lng <= ne.lng;
  });

  if (inBounds.length <= 10) return inBounds;
  return shuffle(inBounds).slice(0, 10);
}

function MapEvents({ onBoundsChange, onRequestNearby }: MapEventsProps) {
  const timerRef = useRef<number | null>(null);
  const lastRequestedCenter = useRef<{ lat: number; lng: number } | null>(null);

  const map = useMapEvents({
    moveend() {
      const bounds = map.getBounds();
      onBoundsChange(bounds);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        const center = map.getCenter();
        const last = lastRequestedCenter.current;
        const shouldFetch =
          !last ||
          Math.abs(center.lat - last.lat) > 0.01 ||
          Math.abs(center.lng - last.lng) > 0.01;

        if (shouldFetch) {
          lastRequestedCenter.current = { lat: center.lat, lng: center.lng };
          onRequestNearby({ lat: center.lat, lng: center.lng });
        }
      }, 300);
    },
    zoomend() {
      onBoundsChange(map.getBounds());
    }
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return null;
}

export function LocationMapClient() {
  const [state, setState] = useState<LocationState>({ status: "loading", stations: [] });
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [groupIndexes, setGroupIndexes] = useState<Record<string, number>>({});
  const [popupVersion, setPopupVersion] = useState(0);
  const [mapBounds, setMapBounds] = useState<Bounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const lastRequestedCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  const TOKYO_LAT = 35.681236;
  const TOKYO_LNG = 139.767125;

  const fetchNearbyStations = useCallback(async (center: { lat: number; lng: number }) => {
    try {
      const response = await fetch(`/api/stations/nearby?lat=${center.lat}&lng=${center.lng}`);
      if (!response.ok) {
        throw new Error("周辺駅の取得に失敗しました。");
      }

      const result = (await response.json()) as { stations: NearbyStation[] };
      setState({ status: "ready", latitude: center.lat, longitude: center.lng, stations: result.stations });
      setMapCenter([center.lat, center.lng]);
      lastRequestedCenterRef.current = center;
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "周辺駅の取得に失敗しました。" });
    }
  }, []);

  useEffect(() => {
    const fallbackCenter = { lat: TOKYO_LAT, lng: TOKYO_LNG };
    let canceled = false;

    fetchNearbyStations(fallbackCenter);

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!canceled) {
          fetchNearbyStations({ lat: position.coords.latitude, lng: position.coords.longitude });
        }
      },
      () => {
        // 位置情報が利用できない場合はフォールバックで東京を維持します。
      },
      { enableHighAccuracy: true }
    );

    return () => {
      canceled = true;
    };
  }, [fetchNearbyStations]);

  const stations = state.status === "ready" ? state.stations : [];

  const stationGroups = useMemo<VisibleGroup[]>(() => {
    const groups = new Map<string, NearbyStation[]>();
    for (const station of stations) {
      if (station.latitude === null || station.longitude === null) continue;
      const key = `${station.latitude}:${station.longitude}`;
      const group = groups.get(key);
      if (group) group.push(station);
      else groups.set(key, [station]);
    }
    return Array.from(groups.entries()).map(([key, groupedStations]) => ({
      key,
      stations: groupedStations,
      latitude: Number(groupedStations[0].latitude),
      longitude: Number(groupedStations[0].longitude)
    }));
  }, [stations]);

  const selectedStation = useMemo(() => {
    if (!selectedGroupKey) return null;
    const group = stationGroups.find((entry) => entry.key === selectedGroupKey);
    if (!group) return null;
    const index = groupIndexes[selectedGroupKey] ?? 0;
    return group.stations[index] ?? group.stations[0] ?? null;
  }, [groupIndexes, selectedGroupKey, stationGroups]);

  const initialCenter: [number, number] = state.status === "ready" ? [state.latitude, state.longitude] : [TOKYO_LAT, TOKYO_LNG];
  const effectiveMapCenter = mapCenter ?? initialCenter;

  const initialBounds = useMemo(() => {
    const lat = effectiveMapCenter[0];
    const lng = effectiveMapCenter[1];
    const halfWidthKm = 2.5;
    const latKmPerDeg = 110.574;
    const lngKmPerDeg = 111.320 * Math.cos((lat * Math.PI) / 180);
    const latDelta = halfWidthKm / latKmPerDeg;
    const lngDelta = halfWidthKm / lngKmPerDeg;
    return [
      [lat - latDelta, lng - lngDelta],
      [lat + latDelta, lng + lngDelta]
    ] as [[number, number], [number, number]];
  }, [effectiveMapCenter]);

  const visibleGroups = useMemo(() => {
    const groups = computeVisible(stationGroups, mapBounds ?? initialBounds);
    return groups.length > 0 ? groups : stationGroups.slice(0, 10);
  }, [stationGroups, mapBounds, initialBounds]);

  const requestNearby = useCallback(async (center: { lat: number; lng: number }) => {
    const last = lastRequestedCenterRef.current;
    if (last && Math.abs(center.lat - last.lat) <= 0.01 && Math.abs(center.lng - last.lng) <= 0.01) {
      return;
    }

    lastRequestedCenterRef.current = center;
    try {
      const response = await fetch(`/api/stations/nearby?lat=${center.lat}&lng=${center.lng}`);
      if (!response.ok) {
        throw new Error("周辺駅の取得に失敗しました。");
      }
      const result = (await response.json()) as { stations: NearbyStation[] };
      setState({ status: "ready", latitude: center.lat, longitude: center.lng, stations: result.stations });
      setMapCenter([center.lat, center.lng]);
    } catch {
      // ignore repeated fetch failures during user interaction.
    }
  }, []);

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

  return (
    <div className="stack">
      <div className="inline-meta">{state.status === "error" ? <span className="pill">{state.message}</span> : null}</div>

      <div className="card map-panel">
        <MapContainer
          key={`${effectiveMapCenter[0]},${effectiveMapCenter[1]}`}
          center={effectiveMapCenter}
          zoom={13}
          className="map-frame"
          scrollWheelZoom
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
            maxZoom={19}
          />

          <MapEvents onBoundsChange={setMapBounds} onRequestNearby={requestNearby} />

          {visibleGroups.map((group) => {
            const index = groupIndexes[group.key] ?? 0;
            const station = group.stations[index] ?? group.stations[0];
            return (
              <CircleMarker
                key={group.key}
                center={[group.latitude, group.longitude]}
                eventHandlers={{
                  click: () => {
                    const nextIndex =
                      selectedGroupKey === group.key
                        ? ((groupIndexes[group.key] ?? 0) + 1) % group.stations.length
                        : 0;
                    setSelectedGroupKey(group.key);
                    setGroupIndexes((current) => ({ ...current, [group.key]: nextIndex }));
                    setPopupVersion((current) => current + 1);
                  }
                }}
                pathOptions={{
                  color: station.first_achieved_on ? "#2563eb" : "#dc2626",
                  fillColor: station.first_achieved_on ? "#2563eb" : "#dc2626",
                  fillOpacity: 0.98,
                  weight: 2,
                  opacity: 1
                }}
                radius={12}
              >
                <Popup key={`${group.key}:${index}:${popupVersion}`}>
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
          <div className="list-link nearby-station-card">
            <strong className="nearby-station-name">{selectedStation.name}</strong>
            <div className="nearby-record">
              <div className="nearby-record-row">
                <span className="nearby-record-label">会社名:</span>
                <span>{selectedStation.company_name}</span>
              </div>
              <div className="nearby-record-row">
                <span className="nearby-record-label">初乗降車日:</span>
                <span>{selectedStation.first_achieved_on ? formatFirstAchievedOn(selectedStation.first_achieved_on) : "未達成"}</span>
              </div>
              <div className="nearby-record-row">
                <span className="nearby-record-label">備考:</span>
                <span>{selectedStation.note ? selectedStation.note : "なし"}</span>
              </div>
            </div>
          </div>
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
