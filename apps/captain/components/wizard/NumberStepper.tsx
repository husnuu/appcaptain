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
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        aria-label="Azalt"
        disabled={!canDecrement}
        onClick={() => commit((Number.isNaN(parsed) ? min : current) - step)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-500 text-brand-600 transition-all hover:bg-brand-500 hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white disabled:hover:text-gray-300"
      >
        <FontAwesomeIcon icon={faMinus} className="text-[13px]" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
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
        className={cn(
          "w-12 rounded-lg border-2 bg-white text-center text-lg font-semibold text-gray-900 outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          error ? "border-danger-400" : "border-transparent focus:border-brand-500"
        )}
        placeholder="0"
      />
      <button
        type="button"
        aria-label="Artır"
        disabled={!canIncrement}
        onClick={() => commit((Number.isNaN(parsed) ? min : current) + step)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        <FontAwesomeIcon icon={faPlus} className="text-[13px]" aria-hidden />
      </button>
    </div>
  );
}
