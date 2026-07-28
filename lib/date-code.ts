export type DateParts = {
  year: string;
  month: string;
  day: string;
};

export const UNKNOWN_LABEL = "不明";

const UNKNOWN_VALUE = "unknown";

export const yearOptions = Array.from({ length: 120 }, (_, index) => {
  const year = String(new Date().getFullYear() - index);
  return { value: year, label: year };
});

export const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, "0");
  return { value: month, label: month };
});

export function getUnknownValue() {
  return UNKNOWN_VALUE;
}

export function decodeFirstAchievedOn(code: string | null): DateParts {
  if (!code) {
    return { year: "", month: "", day: "" };
  }
  if (code === "99999999") {
    return { year: UNKNOWN_VALUE, month: UNKNOWN_VALUE, day: UNKNOWN_VALUE };
  }
  const year = code.slice(0, 4);
  const month = code.slice(4, 6) === "99" ? UNKNOWN_VALUE : code.slice(4, 6);
  const day = code.slice(6, 8) === "99" ? UNKNOWN_VALUE : code.slice(6, 8);
  return { year, month, day };
}

export function encodeFirstAchievedOn(parts: DateParts): string | null {
  const { year, month, day } = parts;

  if (!year && !month && !day) {
    return null;
  }

  if (year === UNKNOWN_VALUE) {
    return "99999999";
  }

  if (!year) {
    throw new Error("年を入力してください。");
  }

  if (month === UNKNOWN_VALUE) {
    return `${year}9999`;
  }

  if (!month) {
    throw new Error("月を入力してください。");
  }

  if (day === UNKNOWN_VALUE) {
    return `${year}${month}99`;
  }

  if (!day) {
    throw new Error("日を入力してください。");
  }

  return `${year}${month}${day}`;
}

export function formatFirstAchievedOn(code: string | null): string {
  if (!code) {
    return "未記録";
  }
  if (code === "99999999") {
    return "不明";
  }

  const year = code.slice(0, 4);
  const month = code.slice(4, 6);
  const day = code.slice(6, 8);

  if (month === "99") {
    return `${year}年頃`;
  }

  if (day === "99") {
    return `${year}年${Number(month)}月頃`;
  }

  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function getDayOptions(yearValue: string, monthValue: string) {
  if (!yearValue || yearValue === UNKNOWN_VALUE || !monthValue || monthValue === UNKNOWN_VALUE) {
    return [];
  }

  const year = Number(yearValue);
  const month = Number(monthValue);
  const lastDay = new Date(year, month, 0).getDate();

  return Array.from({ length: lastDay }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return { value: day, label: day };
  });
}
