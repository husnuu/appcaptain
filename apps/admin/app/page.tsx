"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";

type DashboardData = Awaited<ReturnType<typeof api.getDashboard>>;
type Period = "7d" | "30d";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "green" | "yellow" | "red" | "purple";
}) {
  const borderColor = {
    blue: "border-l-blue-500",
    green: "border-l-green-500",
    yellow: "border-l-yellow-500",
    red: "border-l-red-500",
    purple: "border-l-purple-500",
  }[accent ?? "blue"];

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm border-l-4 ${borderColor}`}
    >
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");

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

  const trendSlice = period === "7d" ? weeklyTrend.slice(-7) : weeklyTrend;
  const maxCount = Math.max(...trendSlice.map((d) => d.count), 1);
  const maxRevenue = Math.max(...trendSlice.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* KPI — Users */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Kullanıcılar
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Toplam Kullanıcı" value={stats.totalProfiles} accent="blue" />
          <StatCard label="Tekne Sahipleri" value={stats.totalOwners} accent="blue" />
          <StatCard label="Toplam Kaptan" value={stats.totalCaptains} accent="blue" />
          <StatCard label="Toplam Organizatör" value={0} accent="blue" sub="Yakında" />
        </div>
      </div>

      {/* KPI — Listings */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
          İlanlar
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Yayındaki İlanlar" value={stats.activeListings} accent="green" />
          <StatCard label="Onay Bekleyen" value={stats.pendingListings} accent="yellow" />
          <StatCard label="Askıya Alınmış" value={stats.suspendedListings} accent="red" />
          <StatCard
            label="Bekleyen Doğrulamalar"
            value={stats.pendingVerifications}
            accent="yellow"
          />
        </div>
      </div>

      {/* KPI — Reservations */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Rezervasyonlar
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Toplam Rezervasyon" value={stats.totalBookings} accent="purple" />
          <StatCard label="Aktif Rezervasyonlar" value={stats.approvedBookings} accent="green" />
          <StatCard label="Bekleyen Rezervasyon" value={stats.pendingBookings} accent="yellow" />
          <StatCard label="Bugünkü Rezervasyonlar" value={stats.todayBookings} accent="blue" />
          <StatCard label="İptal Oranı" value={`%${stats.cancellationRate}`} accent="red" />
        </div>
      </div>

      {/* KPI — Finance & Support */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Finans & Destek
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label="Toplam Ciro"
            value={`₺${(stats.totalRevenue ?? 0).toLocaleString("tr-TR")}`}
            accent="green"
          />
          <StatCard
            label="Platform Komisyonu"
            value={`₺${(stats.platformCommission ?? 0).toLocaleString("tr-TR")}`}
            sub={`%${stats.commissionRate ?? 0} oran`}
            accent="green"
          />
          <StatCard label="Bekleyen Destek Talepleri" value={0} accent="red" sub="Yakında" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Reservation trend chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Rezervasyon Trendi</h2>
            <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
              <button
                onClick={() => setPeriod("7d")}
                className={`px-3 py-1 ${period === "7d" ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                7 Gün
              </button>
              <button
                onClick={() => setPeriod("30d")}
                className={`px-3 py-1 border-l border-gray-200 ${period === "30d" ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                30 Gün
              </button>
            </div>
          </div>
          <div className="flex h-32 items-end gap-0.5">
            {trendSlice.map((d) => (
              <div key={d.date} className="group relative flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t bg-blue-500"
                  style={{
                    height: `${Math.round((d.count / maxCount) * 100)}%`,
                    minHeight: "2px",
                  }}
                />
                <div className="absolute bottom-full mb-1 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-10">
                  {d.date}: {d.count} rezervasyon, ₺{d.revenue.toLocaleString("tr-TR")}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
            <span>{trendSlice[0]?.date}</span>
            <span>{trendSlice[trendSlice.length - 1]?.date}</span>
          </div>
        </div>

        {/* Revenue vs Commission chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Gelir vs Komisyon</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
                Gelir
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-violet-500" />
                Komisyon
              </span>
            </div>
          </div>
          <div className="flex h-32 items-end gap-0.5">
            {trendSlice.map((d) => (
              <div key={d.date} className="group relative flex flex-1 items-end gap-px">
                {/* Revenue bar */}
                <div
                  className="flex-1 rounded-t bg-emerald-500"
                  style={{
                    height: `${Math.round((d.revenue / maxRevenue) * 100)}%`,
                    minHeight: d.revenue > 0 ? "2px" : "0",
                  }}
                />
                {/* Commission bar */}
                <div
                  className="flex-1 rounded-t bg-violet-500"
                  style={{
                    height: `${Math.round((d.commission / maxRevenue) * 100)}%`,
                    minHeight: d.commission > 0 ? "2px" : "0",
                  }}
                />
                <div className="absolute bottom-full mb-1 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-10">
                  {d.date}
                  <br />
                  Gelir: ₺{d.revenue.toLocaleString("tr-TR")}
                  <br />
                  Komisyon: ₺{d.commission.toLocaleString("tr-TR")}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
            <span>{trendSlice[0]?.date}</span>
            <span>{trendSlice[trendSlice.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      {/* Region map — placeholder until Boat model has location fields */}
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm font-medium text-gray-500">Bölgeye Göre İlan Dağılımı</p>
        <p className="mt-1 text-xs text-gray-400">
          Harita görünümü için tekne ilanlarına konum bilgisi eklenmesi gerekiyor.
        </p>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-medium text-gray-700">Son Aktiviteler</h2>
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
