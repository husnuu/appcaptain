"use client";

import { useEffect, useRef } from "react";
import { toTimeInputValue } from "@getyourboat/shared";
import { Select } from "../ui";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const BASE_MINUTES = ["00", "15", "30", "45"];
const ALLOWED_MINUTES = [0, 15, 30, 45];

function splitTime(value: string): { hh: string; mm: string } {
  const normalized = toTimeInputValue(value);
  const match = normalized.match(/^(\d{2}):(\d{2})$/);
  if (!match) return { hh: "", mm: "" };
  return { hh: match[1]!, mm: match[2]! };
}

/** Snaps an arbitrary minute value to the nearest allowed step (00/15/30/45). */
function snapMinute(mm: string): string {
  const n = Number(mm);
  if (Number.isNaN(n)) return "00";
  let best = 0;
  let bestDiff = Infinity;
  for (const a of ALLOWED_MINUTES) {
    const diff = Math.abs(a - n);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = a;
    }
  }
  return String(best).padStart(2, "0");
}

/**
 * 24-hour time picker built from two native <select> controls (hour + minute)
 * so it works consistently across browsers and on mobile. Values are stored as
 * "HH:MM" strings — the same format the API already persists. Minutes are
 * restricted to 00/15/30/45; any legacy value with an odd minute (e.g. "05:31")
 * is self-healed to the nearest allowed step on mount.
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
  const normalized = useRef(false);

  useEffect(() => {
    if (normalized.current) return;
    const trimmed = value.trim();
    if (!trimmed) {
      if (defaultValue) {
        normalized.current = true;
        onChange(defaultValue);
      }
      return;
    }
    const { hh, mm } = splitTime(trimmed);
    normalized.current = true;
    if (hh && !BASE_MINUTES.includes(mm)) {
      onChange(`${hh}:${snapMinute(mm)}`);
    }
  }, [value, defaultValue, onChange]);

  const effective = value.trim() || defaultValue || "";
  const { hh, mm } = splitTime(effective);
  const displayMm = BASE_MINUTES.includes(mm) ? mm : snapMinute(mm);

  const selectClass = "h-11 text-[15px] font-medium text-ink";

  return (
    <div className="flex items-center gap-2">
      <Select
        aria-label={ariaLabel ? `${ariaLabel} — saat` : "Saat"}
        value={hh}
        error={error}
        onChange={(e) => onChange(`${e.target.value}:${displayMm || "00"}`)}
        className={`w-[84px] ${selectClass}`}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </Select>
      <span className="text-[18px] font-semibold text-gray-500">:</span>
      <Select
        aria-label={ariaLabel ? `${ariaLabel} — dakika` : "Dakika"}
        value={displayMm}
        error={error}
        onChange={(e) => onChange(`${hh || "00"}:${e.target.value}`)}
        className={`w-[84px] ${selectClass}`}
      >
        {BASE_MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
    </div>
  );
}
