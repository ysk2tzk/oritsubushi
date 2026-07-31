"use client";

import { useMemo } from "react";
import {
  getDayOptions,
  getUnknownValue,
  monthOptions,
  UNKNOWN_LABEL,
  yearOptions
} from "@/lib/date-code";

type Props = {
  value: {
    year: string;
    month: string;
    day: string;
  };
  onChange: (nextValue: { year: string; month: string; day: string }) => void;
};

export function DateWheel({ value, onChange }: Props) {
  const unknown = getUnknownValue();

  const dayOptions = useMemo(
    () => getDayOptions(value.year, value.month),
    [value.year, value.month]
  );

  return (
    <div className="date-wheel">
      <div className="field">
        <select
          id="year"
          aria-label="年"
          value={value.year}
          onChange={(event) => {
            const year = event.target.value;
            onChange({
              year,
              month: year === unknown ? unknown : value.month,
              day: year === unknown ? unknown : value.day
            });
          }}
        >
          <option value="">選択</option>
          <option value={unknown}>{UNKNOWN_LABEL}</option>
          {yearOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <span className="date-wheel-separator" aria-hidden="true">
        年
      </span>
      <div className="field">
        <select
          id="month"
          aria-label="月"
          value={value.month}
          disabled={!value.year || value.year === unknown}
          onChange={(event) => {
            const month = event.target.value;
            onChange({
              year: value.year,
              month,
              day: month === unknown ? unknown : value.day
            });
          }}
        >
          <option value="">選択</option>
          <option value={unknown}>{UNKNOWN_LABEL}</option>
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <span className="date-wheel-separator" aria-hidden="true">
        月
      </span>
      <div className="field">
        <select
          id="day"
          aria-label="日"
          value={value.day}
          disabled={!value.month || value.month === unknown}
          onChange={(event) => {
            onChange({
              year: value.year,
              month: value.month,
              day: event.target.value
            });
          }}
        >
          <option value="">選択</option>
          <option value={unknown}>{UNKNOWN_LABEL}</option>
          {dayOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <span className="date-wheel-separator" aria-hidden="true">
        日
      </span>
    </div>
  );
}
