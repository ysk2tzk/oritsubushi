"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomTabs } from "@/components/bottom-tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DateWheel } from "@/components/date-wheel";
import { DateParts, decodeFirstAchievedOn, encodeFirstAchievedOn } from "@/lib/date-code";

type Props = {
  endpoint: string;
  title: string;
  subtitle?: string;
  noteLabel: string;
  todayButtonLabel?: string;
  initialFirstAchievedOn: string | null;
  initialNote: string | null;
  breadcrumbs?: Array<{ label: string; href?: string }>;
};

export function RecordForm({
  endpoint,
  title,
  subtitle,
  noteLabel,
  todayButtonLabel = "今日、乗り降りしました",
  initialFirstAchievedOn,
  initialNote,
  breadcrumbs
}: Props) {
  const router = useRouter();
  const [dateValue, setDateValue] = useState(decodeFirstAchievedOn(initialFirstAchievedOn));
  const [note, setNote] = useState(initialNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function getTodayDateParts(): DateParts {
    const today = new Date();
    return {
      year: String(today.getFullYear()),
      month: String(today.getMonth() + 1).padStart(2, "0"),
      day: String(today.getDate()).padStart(2, "0")
    };
  }

  function getEmptyDateParts(): DateParts {
    return { year: "", month: "", day: "" };
  }

  async function submit(
    clear: boolean,
    value?: DateParts,
    onSuccess?: () => void
  ) {
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          first_achieved_on: clear ? null : encodeFirstAchievedOn(value ?? dateValue),
          note
        })
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "更新に失敗しました。");
      }

      setMessage(clear ? "記録をクリアしました。" : "記録を更新しました。");
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="shell">
        <div className="stack">
          <div className="card">
            <div className="card-inner stack">
              {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumbs items={breadcrumbs} /> : null}
              <div>
                <h1 className="hero-title">{title}</h1>
                {subtitle ? <p className="subtle">{subtitle}</p> : null}
              </div>
              <fieldset className="field" style={{ border: "none", padding: 0, margin: 0 }}>
                <legend>初回達成日</legend>
                <DateWheel value={dateValue} onChange={setDateValue} />
              </fieldset>
              <div className="field">
                <label htmlFor="note">{noteLabel}</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="備考を入力"
                />
              </div>
              {message ? <div className="pill">{message}</div> : null}
              <div className="form-actions">
                <button
                  className="button"
                  disabled={submitting}
                  onClick={() =>
                    void submit(false, getTodayDateParts(), () => {
                      setDateValue(getTodayDateParts());
                    })
                  }
                  type="button"
                >
                  {todayButtonLabel}
                </button>
                <div className="form-actions-right">
                  <button
                    className="ghost-button"
                    disabled={submitting}
                    onClick={() =>
                      void submit(true, undefined, () => {
                        setDateValue(getEmptyDateParts());
                      })
                    }
                    type="button"
                  >
                    未記録に戻す
                  </button>
                  <button className="button" disabled={submitting} onClick={() => void submit(false)} type="button">
                    保存する
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomTabs activeHref="/record" />
    </>
  );
}
