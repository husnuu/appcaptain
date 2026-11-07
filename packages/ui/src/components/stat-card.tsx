import * as React from "react";
import { cn } from "../lib/cn";

export type StatAccent =
  | "brand"
  | "info"
  | "success"
  | "warning"
  | "ink"
  | "danger";

const accentDot: Record<StatAccent, string> = {
  brand: "bg-brand-500",
  info: "bg-accent-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  ink: "bg-ink-800",
  danger: "bg-danger-500",
};

const accentTint: Record<StatAccent, string> = {
  brand: "bg-brand-50",
  info: "bg-accent-50",
  success: "bg-success-50",
  warning: "bg-warning-50",
  ink: "bg-gray-100",
  danger: "bg-danger-50",
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  accent?: StatAccent;
  hint?: string;
  loading?: boolean;
}

/**
 * Panel metrik kartı (Ahoy dili): üstte renkli nokta + etiket, altında büyük değer.
 * `accent` yalnızca küçük gösterge rengini belirler; kart beyaz ve sade kalır.
 */
export function StatCard({
  label,
  value,
  accent = "brand",
  hint,
  loading = false,
}: StatCardProps) {
  return (
    <div className="rounded-card border border-gray-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className={cn("flex h-7 w-7 items-center justify-center rounded-lg", accentTint[accent])}>
          <span className={cn("h-2 w-2 rounded-full", accentDot[accent])} />
        </span>
        <span className="text-body-sm font-semibold text-gray-500">{label}</span>
      </div>
      {loading ? (
        <div className="mt-4 h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
      ) : (
        <div className="mt-3 text-[30px] font-extrabold leading-9 tracking-[-0.03em] text-ink">{value}</div>
      )}
      {hint ? <div className="mt-1 text-caption text-gray-400">{hint}</div> : null}
    </div>
  );
}
