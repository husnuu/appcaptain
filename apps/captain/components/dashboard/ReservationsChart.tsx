"use client";

import { useState } from "react";
import {
  FontAwesomeIcon,
  Skeleton,
  cn,
  faArrowTrendUp,
  faCalendarDays,
  faComments,
  type IconDefinition,
} from "@getyourboat/ui";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReservationSeries } from "../../lib/api/dashboard";
import type { DashboardRange } from "../../lib/mock/dashboard.mock";

const RANGES: { id: DashboardRange; label: string }[] = [
  { id: "30d", label: "Son 30 Gün" },
  { id: "3m", label: "Son 3 Ay" },
  { id: "year", label: "Bu Yıl" },
];

interface SecondaryMetric {
  label: string;
  value: string;
  icon: IconDefinition;
  iconBox: string;
}

export function ReservationsChart() {
  const [range, setRange] = useState<DashboardRange>("30d");
  const { data, isLoading } = useReservationSeries(range);

  const total = data?.reduce((sum, p) => sum + p.reservations, 0) ?? 0;
  const average = data && data.length ? Math.round(total / data.length) : 0;

  const secondary: SecondaryMetric[] = [
    {
      label: "Dönem toplamı",
      value: String(total),
      icon: faCalendarDays,
      iconBox: "bg-brand-50 text-brand-500",
    },
    {
      label: "Ortalama / aralık",
      value: String(average),
      icon: faArrowTrendUp,
      iconBox: "bg-green-50 text-green-600",
    },
    {
      label: "Yanıt oranı",
      value: "%98",
      icon: faComments,
      iconBox: "bg-accent-50 text-accent-600",
    },
  ];

  return (
    <section className="mt-6 rounded-card border border-gray-200/70 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-ink">Rezervasyonlar</h2>
          <p className="mt-0.5 text-caption text-gray-500">
            Seçili dönemde toplam {total} rezervasyon.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                range === r.id
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-ink"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="reservationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#183D85" />
                  <stop offset="100%" stopColor="#6FC3E2" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EC" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#A9A39C" }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#A9A39C" }}
                width={32}
              />
              <Tooltip
                cursor={{ fill: "rgba(24,61,133,0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E8E3DD",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  padding: "8px 12px",
                  fontSize: 12,
                }}
                labelStyle={{ fontWeight: 600, color: "#222830", marginBottom: 2 }}
                formatter={(value) => [`${value} rezervasyon`, ""]}
                separator=""
              />
              <Bar
                dataKey="reservations"
                fill="url(#reservationGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-3">
        {secondary.map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5"
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px]",
                m.iconBox
              )}
              aria-hidden
            >
              <FontAwesomeIcon icon={m.icon} />
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-gray-500">
                {m.label}
              </div>
              <div className="text-body font-semibold text-ink">{m.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
