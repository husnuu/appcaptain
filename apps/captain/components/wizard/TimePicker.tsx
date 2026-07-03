"use client";

import { faClock } from "@getyourboat/ui";
import { useEffect, useRef } from "react";
import { toTimeInputValue } from "@getyourboat/shared";
import { Select } from "../ui";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const BASE_MINUTES = ["00", "15", "30", "45"];

function splitTime(value: string): { hh: string; mm: string } {
  const normalized = toTimeInputValue(value);
  const match = normalized.match(/^(\d{2}):(\d{2})$/);
  if (!match) return { hh: "", mm: "" };
  return { hh: match[1]!, mm: match[2]! };
}

/**
 * 24-hour time picker built from two native <select> controls (hour + minute)
 * so it works consistently across browsers and on mobile. Values are stored as
 * "HH:MM" strings — the same format the API already persists.
 */
export function TimePicker({
  value,
  onChange,
  defaultValue,
  error,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  defaultValue?: string;
  error?: boolean;
  ariaLabel?: string;
}) {
  const appliedDefault = useRef(false);

  useEffect(() => {
    if (appliedDefault.current) return;
    if (!value.trim() && defaultValue) {
      appliedDefault.current = true;
      onChange(defaultValue);
    }
  }, [value, defaultValue, onChange]);

  const effective = value.trim() || defaultValue || "";
  const { hh, mm } = splitTime(effective);

  const minuteOptions = mm && !BASE_MINUTES.includes(mm) ? [...BASE_MINUTES, mm] : BASE_MINUTES;

  return (
    <div className="flex items-center gap-2">
      <Select
        aria-label={ariaLabel ? `${ariaLabel} — saat` : "Saat"}
        leftIcon={faClock}
        value={hh}
        error={error}
        onChange={(e) => onChange(`${e.target.value}:${mm || "00"}`)}
        className="w-[92px]"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </Select>
      <span className="text-gray-400">:</span>
      <Select
        aria-label={ariaLabel ? `${ariaLabel} — dakika` : "Dakika"}
        value={mm}
        error={error}
        onChange={(e) => onChange(`${hh || "00"}:${e.target.value}`)}
        className="w-[76px]"
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
    </div>
  );
}
