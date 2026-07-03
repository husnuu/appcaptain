"use client";

import { useState } from "react";
import { Skeleton } from "@getyourboat/ui";
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
  { id: "30d", label: "Son 30 gün" },
  { id: "3m", label: "Son 3 ay" },
  { id: "year", label: "Bu yıl" },
];

export function ReservationsChart() {
  const [range, setRange] = useState<DashboardRange>("30d");
  const { data, isLoading } = useReservationSeries(range);

  const total = data?.reduce((sum, p) => sum + p.reservations, 0) ?? 0;

  return (
    <section className="mt-6 rounded-card border border-gray-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-subheading font-semibold text-ink">Rezervasyonlar</h2>
          <p className="mt-0.5 text-caption text-gray-500">
            Seçili dönemde toplam {total} rezervasyon.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={
                range === r.id
                  ? "rounded-lg bg-white px-3 py-1.5 text-[13px] font-medium text-ink shadow-sm"
                  : "rounded-lg px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-ink"
              }
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
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#9AA1AC" }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#9AA1AC" }}
                width={32}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,85,51,0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                }}
                formatter={(value) => [`${value}`, "Rezervasyon"]}
              />
              <Bar dataKey="reservations" fill="#FF5533" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
