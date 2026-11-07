"use client";

import {
  Alert,
  FontAwesomeIcon,
  cn,
  faAnchor,
  faArrowTrendUp,
  faCircleCheck,
  faClock,
  faLayerGroup,
  faStar,
  type IconDefinition,
} from "@getyourboat/ui";
import type { DashboardStatsDTO } from "@getyourboat/shared";

interface StatGridProps {
  stats?: DashboardStatsDTO;
  loading: boolean;
  error: boolean;
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CardConfig {
  label: string;
  value: string;
  hint?: string;
  icon: IconDefinition;
  /** Tailwind classes for the tinted icon box. */
  iconBox: string;
}

export function StatGrid({ stats, loading, error }: StatGridProps) {
  if (error) {
    return <Alert variant="danger">İstatistikler yüklenemedi. Lütfen tekrar dene.</Alert>;
  }

  const cards: CardConfig[] = [
    {
      label: "Toplam kazanç",
      value: stats ? formatMoney(stats.totalEarning.amount, stats.totalEarning.currency) : "—",
      icon: faArrowTrendUp,
      iconBox: "bg-green-50 text-green-600",
    },
    {
      label: "Onay bekleyen müsaitlik",
      value: stats ? String(stats.availabilityAwaiting) : "—",
      icon: faClock,
      iconBox: "bg-amber-50 text-amber-600",
    },
    {
      label: "Onaylanan müsaitlik",
      value: stats ? String(stats.availabilityConfirmed) : "—",
      icon: faCircleCheck,
      iconBox: "bg-accent-50 text-accent-600",
    },
    {
      label: "Opsiyonlu",
      value: stats ? String(stats.optioned) : "—",
      icon: faLayerGroup,
      iconBox: "bg-violet-50 text-violet-500",
    },
    {
      label: "Aktif tekneler",
      value: stats ? String(stats.activeBoats) : "—",
      icon: faAnchor,
      iconBox: "bg-brand-50 text-brand-500",
    },
    {
      label: "Puan",
      value: stats?.rating.average != null ? stats.rating.average.toFixed(1) : "–",
      hint: stats ? `${stats.rating.count} değerlendirme` : undefined,
      icon: faStar,
      iconBox: "bg-amber-50 text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-card border border-gray-200/70 bg-white p-5 shadow-card transition duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <span
            className={cn("grid h-10 w-10 place-items-center rounded-xl text-[16px]", c.iconBox)}
            aria-hidden
          >
            <FontAwesomeIcon icon={c.icon} />
          </span>
          {loading ? (
            <div className="mt-4 h-7 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <div className="mt-4 text-[26px] font-extrabold leading-none tracking-tight text-ink">{c.value}</div>
          )}
          <div className="mt-2 text-[13.5px] font-medium text-gray-500">{c.label}</div>
          {c.hint ? <div className="mt-0.5 text-[12px] text-gray-400">{c.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
