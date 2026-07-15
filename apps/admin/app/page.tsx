"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";

type DashboardData = Awaited<ReturnType<typeof api.getDashboard>>;

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Yükleniyor...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const { stats, recentActivity, weeklyTrend } = data;
  const maxCount = Math.max(...weeklyTrend.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard label="Toplam Kullanıcı" value={stats.totalProfiles} />
        <StatCard label="Tekne Sahipleri" value={stats.totalOwners} />
        <StatCard label="Aktif İlanlar" value={stats.activeListings} />
        <StatCard label="Onay Bekleyen" value={stats.pendingListings} />
        <StatCard label="Askıya Alınmış" value={stats.suspendedListings} />
        <StatCard label="Toplam Rezervasyon" value={stats.totalBookings} />
        <StatCard label="Bekleyen Rezervasyon" value={stats.pendingBookings} />
        <StatCard label="Onaylı Rezervasyon" value={stats.approvedBookings} />
        <StatCard label="İptal Oranı" value={`%${stats.cancellationRate}`} />
        <StatCard label="Bugün Yeni" value={stats.todayBookings} />
        <StatCard
          label="Toplam Gelir"
          value={`₺${stats.totalRevenue.toLocaleString("tr-TR")}`}
          sub={`Komisyon: ₺${stats.platformCommission.toLocaleString("tr-TR")} (%${stats.commissionRate})`}
        />
      </div>

      {/* 14-day trend */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-gray-700">Son 14 Gün — Rezervasyon Trendi</h2>
        <div className="flex h-32 items-end gap-1">
          {weeklyTrend.map((d) => (
            <div key={d.date} className="group relative flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-t bg-blue-500"
                style={{ height: `${Math.round((d.count / maxCount) * 100)}%`, minHeight: "2px" }}
              />
              <div className="absolute bottom-full mb-1 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-10">
                {d.date}: {d.count} rezervasyon, ₺{d.revenue.toLocaleString("tr-TR")}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>{weeklyTrend[0]?.date}</span>
          <span>{weeklyTrend[weeklyTrend.length - 1]?.date}</span>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-medium text-gray-700">Son İşlemler</h2>
        </div>
        <ul className="divide-y divide-gray-50">
          {recentActivity.map((log) => (
            <li key={log.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-600 shrink-0">
                {log.action}
              </span>
              <span className="text-sm text-gray-700 truncate">
                {log.targetType && log.targetId
                  ? `${log.targetType} #${log.targetId.slice(0, 8)}`
                  : ""}
              </span>
              <span className="ml-auto shrink-0 text-xs text-gray-400">
                {log.admin.fullName} · {new Date(log.createdAt).toLocaleDateString("tr-TR")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
