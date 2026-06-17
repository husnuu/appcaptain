export interface ProgressBarProps {
  percent: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

/** Horizontal progress bar with brand fill. Clamped to 0–100. */
export function ProgressBar({
  percent,
  label,
  showValue = true,
  className,
}: ProgressBarProps) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={className}>
      {label || showValue ? (
        <div className="mb-1 flex items-center justify-between text-caption text-gray-600">
          <span>{label}</span>
          {showValue ? <span className="font-semibold text-ink">{value}%</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-pill bg-gray-200"
      >
        <div
          className="h-full rounded-pill bg-brand-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
