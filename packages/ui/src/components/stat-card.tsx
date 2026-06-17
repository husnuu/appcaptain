import * as React from "react";
import { cn } from "../lib/cn";

export type StatAccent =
  | "brand"
  | "info"
  | "success"
  | "warning"
  | "ink"
  | "danger";

const accentBar: Record<StatAccent, string> = {
  brand: "bg-brand-500",
  info: "bg-info-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  ink: "bg-ink-800",
  danger: "bg-danger-500",
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  accent?: StatAccent;
  hint?: string;
  loading?: boolean;
}

/**
 * Dashboard metric card. Label on top, large value below, and a thin colored
 * accent line on the bottom edge (color per metric via `accent`).
 */
export function StatCard({
  label,
  value,
  accent = "brand",
  hint,
  loading = false,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-card border border-gray-300 bg-white p-4 shadow-card">
      <div className="text-caption font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-100" />
      ) : (
        <div className="mt-1 text-heading text-ink">{value}</div>
      )}
      {hint ? <div className="mt-1 text-caption text-gray-400">{hint}</div> : null}
      <span
        aria-hidden
        className={cn("absolute inset-x-0 bottom-0 h-1", accentBar[accent])}
      />
    </div>
  );
}
