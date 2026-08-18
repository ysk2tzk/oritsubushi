"use client";

import { useState } from "react";

export function HistoryExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/history/export", {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "出力に失敗しました。");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/);
      const fileName = decodeURIComponent(fileNameMatch?.[1] ?? "乗降車記録.xlsx");
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "出力に失敗しました。");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="history-export-control">
      <button
        className="button history-top-action"
        type="button"
        onClick={handleClick}
        disabled={isExporting}
        aria-busy={isExporting}
      >
        {isExporting ? "乗降車記録を出力中..." : "乗降車記録出力"}
      </button>
      {isExporting ? <p className="subtle history-export-message">ファイルを準備しています。</p> : null}
      {errorMessage ? <p className="history-export-error">{errorMessage}</p> : null}
    </div>
  );
}
