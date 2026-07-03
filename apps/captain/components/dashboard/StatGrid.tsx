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
      label: "Toplam Kazanç",
      value: stats ? formatMoney(stats.totalEarning.amount, stats.totalEarning.currency) : "—",
      icon: faArrowTrendUp,
      iconBox: "bg-success-50 text-success-500",
    },
    {
      label: "Onay Bekleyen Müsaitlik",
      value: stats ? String(stats.availabilityAwaiting) : "—",
      icon: faClock,
      iconBox: "bg-warning-50 text-warning-500",
    },
    {
      label: "Onaylanan Müsaitlik",
      value: stats ? String(stats.availabilityConfirmed) : "—",
      icon: faCircleCheck,
      iconBox: "bg-info-50 text-info-500",
    },
    {
      label: "Opsiyonlu",
      value: stats ? String(stats.optioned) : "—",
      icon: faLayerGroup,
      iconBox: "bg-[#F5F3FF] text-[#8B5CF6]",
    },
    {
      label: "Aktif Tekneler",
      value: stats ? String(stats.activeBoats) : "—",
      icon: faAnchor,
      iconBox: "bg-brand-50 text-brand-500",
    },
    {
      label: "Puan",
      value: stats?.rating.average != null ? stats.rating.average.toFixed(1) : "–",
      hint: stats ? `${stats.rating.count} değerlendirme` : undefined,
      icon: faStar,
      iconBox: "bg-[#FEFCE8] text-[#EAB308]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-[15px]",
              c.iconBox
            )}
            aria-hidden
          >
            <FontAwesomeIcon icon={c.icon} />
          </span>
          <div className="mt-3 text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {c.label}
          </div>
          {loading ? (
            <div className="mt-1.5 h-8 w-20 animate-pulse rounded bg-gray-100" />
          ) : (
            <div className="mt-1 text-[28px] font-bold leading-tight text-ink">{c.value}</div>
          )}
          {c.hint ? <div className="mt-0.5 text-caption text-gray-400">{c.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
