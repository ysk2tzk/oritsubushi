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
    <div className="value-pair" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
      <div className="field">
        <label htmlFor="year">年</label>
        <select
          id="year"
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
      <div className="field">
        <label htmlFor="month">月</label>
        <select
          id="month"
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
      <div className="field">
        <label htmlFor="day">日</label>
        <select
          id="day"
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
    </div>
  );
}
