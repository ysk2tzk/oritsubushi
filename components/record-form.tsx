"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DateWheel } from "@/components/date-wheel";
import { decodeFirstAchievedOn, encodeFirstAchievedOn, formatFirstAchievedOn } from "@/lib/date-code";

type Props = {
  endpoint: string;
  title: string;
  subtitle?: string;
  noteLabel: string;
  initialFirstAchievedOn: string | null;
  initialNote: string | null;
  backHref?: string;
};

export function RecordForm({
  endpoint,
  title,
  subtitle,
  noteLabel,
  initialFirstAchievedOn,
  initialNote,
  backHref
}: Props) {
  const router = useRouter();
  const [dateValue, setDateValue] = useState(decodeFirstAchievedOn(initialFirstAchievedOn));
  const [note, setNote] = useState(initialNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(clear: boolean) {
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          first_achieved_on: clear ? null : encodeFirstAchievedOn(dateValue),
          note
        })
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "更新に失敗しました。");
      }

      setMessage(clear ? "記録をクリアしました。" : "記録を更新しました。");
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
            <div>
              <h1 className="hero-title">{title}</h1>
              {subtitle ? <p className="subtle">{subtitle}</p> : null}
              <div className="pill">現在値: {formatFirstAchievedOn(initialFirstAchievedOn)}</div>
            </div>
            <div className="field">
              <label htmlFor="note">{noteLabel}</label>
              <textarea
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="備考を入力"
              />
            </div>
            <fieldset className="field" style={{ border: "none", padding: 0, margin: 0 }}>
              <legend>初回達成日</legend>
              <DateWheel value={dateValue} onChange={setDateValue} />
            </fieldset>
            {message ? <div className="pill">{message}</div> : null}
            <div className="form-actions">
              <button className="button" disabled={submitting} onClick={() => void submit(false)} type="button">
                保存する
              </button>
              <button
                className="ghost-button"
                disabled={submitting}
                onClick={() => void submit(true)}
                type="button"
              >
                未記録に戻す
              </button>
            </div>
            {backHref ? (
              <a className="ghost-button" href={backHref}>
                戻る
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
