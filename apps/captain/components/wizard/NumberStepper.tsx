"use client";

import { FontAwesomeIcon, cn, faMinus, faPlus } from "@getyourboat/ui";

/**
 * +/- adjustable numeric input for count fields (kapasite, kabin, mürettebat,
 * tuvalet…). Prevents invalid entries (harf, negatif sayı) while still allowing
 * the captain to type a value directly.
 */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  error,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: boolean;
  ariaLabel?: string;
}) {
  const parsed = value === "" ? NaN : Number(value);
  const current = Number.isNaN(parsed) ? min : parsed;
  const canDecrement = value !== "" && current > min;
  const canIncrement = max === undefined || current < max;

  function commit(next: number) {
    let clamped = next;
    if (clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;
    onChange(String(clamped));
  }

  return (
    <div
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-xl border bg-white",
        error ? "border-danger-400" : "border-gray-300"
      )}
    >
      <button
        type="button"
        aria-label="Azalt"
        disabled={!canDecrement}
        onClick={() => commit((Number.isNaN(parsed) ? min : current) - step)}
        className="flex w-10 items-center justify-center text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <FontAwesomeIcon icon={faMinus} className="text-[12px]" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange("");
            return;
          }
          const n = Number(raw);
          if (Number.isNaN(n)) return;
          commit(n);
        }}
        className="w-14 border-x border-gray-200 text-center text-body-sm text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        placeholder="0"
      />
      <button
        type="button"
        aria-label="Artır"
        disabled={!canIncrement}
        onClick={() => commit((Number.isNaN(parsed) ? min : current) + step)}
        className="flex w-10 items-center justify-center text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <FontAwesomeIcon icon={faPlus} className="text-[12px]" aria-hidden />
      </button>
    </div>
  );
}
