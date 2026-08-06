"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DateWheel } from "@/components/date-wheel";
import { DateParts, encodeFirstAchievedOn } from "@/lib/date-code";

type StationOption = {
  id: number;
  name: string;
};

type Props = {
  endpoint: string;
  title: string;
  subtitle?: string;
  stations: StationOption[];
  breadcrumbs: Array<{ label: string; href?: string }>;
};

function getTodayDateParts(): DateParts {
  const today = new Date();
  return {
    year: String(today.getFullYear()),
    month: String(today.getMonth() + 1).padStart(2, "0"),
    day: String(today.getDate()).padStart(2, "0")
  };
}

export function MultiSectionRecordForm({
  endpoint,
  title,
  subtitle,
  stations,
  breadcrumbs
}: Props) {
  const router = useRouter();
  const [fromStationId, setFromStationId] = useState(stations[0]?.id ? String(stations[0].id) : "");
  const [toStationId, setToStationId] = useState(stations[1]?.id ? String(stations[1].id) : "");
  const [dateValue, setDateValue] = useState<DateParts>(getTodayDateParts());
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fromIndex = stations.findIndex((station) => String(station.id) === fromStationId);
  const toOptions = useMemo(
    () => stations.filter((_, index) => (fromIndex === -1 ? true : index > fromIndex)),
    [fromIndex, stations]
  );

  async function submit() {
    setSubmitting(true);
    setMessage(null);

    try {
      const firstAchievedOn = encodeFirstAchievedOn(dateValue);
      if (!firstAchievedOn) {
        throw new Error("年月日を入力してください。");
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from_station_id: Number(fromStationId),
          to_station_id: Number(toStationId),
          first_achieved_on: firstAchievedOn
        })
      });

      const result = (await response.json()) as { error?: string; updatedCount?: number };
      if (!response.ok) {
        throw new Error(result.error ?? "更新に失敗しました。");
      }

      setMessage(
        (result.updatedCount ?? 0) > 0
          ? `${result.updatedCount}区間を記録しました。`
          : "更新対象の未記録区間はありませんでした。"
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell">
      <div className="stack">
        <div className="card">
          <div className="card-inner stack">
            <Breadcrumbs items={breadcrumbs} />
            <div>
              <h1 className="hero-title">{title}</h1>
              {subtitle ? <p className="subtle">{subtitle}</p> : null}
            </div>
            <div className="field">
              <label htmlFor="from-station">発駅</label>
              <select
                id="from-station"
                value={fromStationId}
                onChange={(event) => {
                  const nextFromStationId = event.target.value;
                  setFromStationId(nextFromStationId);

                  const nextFromIndex = stations.findIndex(
                    (station) => String(station.id) === nextFromStationId
                  );
                  const currentToIndex = stations.findIndex(
                    (station) => String(station.id) === toStationId
                  );

                  if (nextFromIndex !== -1 && currentToIndex <= nextFromIndex) {
                    const fallback = stations[nextFromIndex + 1];
                    setToStationId(fallback ? String(fallback.id) : "");
                  }
                }}
              >
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="to-station">着駅</label>
              <select
                id="to-station"
                value={toStationId}
                disabled={toOptions.length === 0}
                onChange={(event) => setToStationId(event.target.value)}
              >
                {toOptions.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>
            <fieldset className="field" style={{ border: "none", padding: 0, margin: 0 }}>
              <legend>初回達成日</legend>
              <DateWheel value={dateValue} onChange={setDateValue} />
            </fieldset>
            {message ? <div className="pill">{message}</div> : null}
            <div className="form-actions">
              <span className="subtle">既に記録済みの区間は更新しません。</span>
              <div className="form-actions-right">
                <button
                  className="button"
                  disabled={submitting || !fromStationId || !toStationId}
                  onClick={() => void submit()}
                  type="button"
                >
                  記録する
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
