"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FontAwesomeIcon,
  cn,
  faAnchor,
  faArrowRight,
  faArrowTrendUp,
  faCalendarCheck,
  faCircleCheck,
  faCircleXmark,
  faClipboardList,
  faClock,
  faHeadset,
  faIdCard,
  faMapLocationDot,
  faPercent,
  faShieldHalved,
  faShip,
  faTriangleExclamation,
  faUsers,
  faWallet,
  type IconDefinition,
} from "@getyourboat/ui";
import { api, ApiError } from "../lib/api";

type DashboardData = Awaited<ReturnType<typeof api.getDashboard>>;
type Period = "7d" | "30d";
type Tone = "navy" | "sky" | "green" | "amber" | "red" | "violet";

const TONE: Record<Tone, string> = {
  navy: "bg-brand-50 text-brand-500",
  sky: "bg-accent-50 text-accent-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-500",
  violet: "bg-violet-50 text-violet-500",
};

const money = (n: number | undefined) => `₺${(n ?? 0).toLocaleString("tr-TR")}`;

function KpiCard({
  label,
  value,
  sub,
  icon,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: IconDefinition;
  tone?: Tone;
}) {
  return (
    <div className="rounded-card border border-gray-200/70 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("grid h-10 w-10 place-items-center rounded-xl", TONE[tone])}>
          <FontAwesomeIcon icon={icon} className="text-[16px]" aria-hidden />
        </span>
        {sub && (
          <span className="truncate rounded-full bg-gray-100 px-2.5 py-1 text-[11.5px] font-semibold text-gray-500">
            {sub}
          </span>
        )}
      </div>
      <p className="mt-4 text-[28px] font-extrabold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-[13.5px] font-medium text-gray-500">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[17px] font-bold tracking-tight text-ink">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function PeriodToggle({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex rounded-full bg-gray-100 p-1 text-[12.5px] font-semibold" role="tablist" aria-label="Dönem">
      {(["7d", "30d"] as const).map((p) => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={period === p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            period === p ? "bg-white text-ink shadow-sm" : "text-gray-500 hover:text-ink"
          )}
        >
          {p === "7d" ? "7 gün" : "30 gün"}
        </button>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Yükleniyor">
      <div className="h-16 w-72 animate-pulse rounded-2xl bg-gray-200/60" />
      <div className="h-28 animate-pulse rounded-card bg-gray-200/50" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[136px] animate-pulse rounded-card bg-gray-200/50" />
        ))}
      </div>
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

  if (loading) return <DashboardSkeleton />;
  if (error)
    return (
      <div className="flex items-center gap-3 rounded-card border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
        <FontAwesomeIcon icon={faTriangleExclamation} aria-hidden />
        {error}
      </div>
    );
  if (!data) return null;

  const { stats, recentActivity, weeklyTrend } = data;

  const trendSlice = period === "7d" ? weeklyTrend.slice(-7) : weeklyTrend;
  const maxCount = Math.max(...trendSlice.map((d) => d.count), 1);
  const maxRevenue = Math.max(...trendSlice.map((d) => d.revenue), 1);
  const periodBookings = trendSlice.reduce((s, d) => s + d.count, 0);
  const periodRevenue = trendSlice.reduce((s, d) => s + d.revenue, 0);

  const today = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const queue: { label: string; hint: string; count: number; href: string; icon: IconDefinition }[] = [
    { label: "Onay bekleyen ilanlar", hint: "İncele ve yayınla", count: stats.pendingListings, href: "/boats", icon: faShip },
    { label: "Bekleyen rezervasyonlar", hint: "Kaptan yanıtı bekleniyor", count: stats.pendingBookings, href: "/reservations", icon: faCalendarCheck },
    { label: "KYC doğrulamaları", hint: "Belgeleri kontrol et", count: stats.pendingKycDocs, href: "/kyc", icon: faIdCard },
    { label: "Destek talepleri", hint: "Yanıt bekleyenler", count: stats.pendingSupportTickets, href: "/support", icon: faHeadset },
  ];
  const queueTotal = queue.reduce((s, q) => s + q.count, 0);

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold capitalize text-accent-600">{today}</p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight text-ink sm:text-[30px]">Genel bakış</h1>
          <p className="mt-1 text-[15px] text-gray-500">Ahoy platformunun güncel durumu tek ekranda.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faMapLocationDot} className="text-gray-400" aria-hidden />
            Harita
          </Link>
          <Link
            href="/boats"
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            İlanları yönet
            <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" aria-hidden />
          </Link>
        </div>
      </header>

      {/* Bekleyen işler */}
      <section className="rounded-card border border-gray-200/70 bg-white p-2 shadow-card">
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <h2 className="text-[15px] font-bold text-ink">Senden bekleyenler</h2>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[12px] font-bold",
              queueTotal > 0 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
            )}
          >
            {queueTotal > 0 ? `${queueTotal} iş` : "Hepsi tamam"}
          </span>
        </div>
        <div className="grid gap-1 sm:grid-cols-2 min-[1600px]:grid-cols-4">
          {queue.map((q) => (
            <Link
              key={q.label}
              href={q.href}
              className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors hover:bg-cream"
            >
              <span
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                  q.count > 0 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-400"
                )}
              >
                <FontAwesomeIcon icon={q.icon} className="text-[16px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-semibold text-ink">{q.label}</span>
                <span className="block truncate text-[12.5px] text-gray-500">{q.hint}</span>
              </span>
              <span className={cn("text-[22px] font-extrabold tabular-nums", q.count > 0 ? "text-ink" : "text-gray-300")}>
                {q.count}
              </span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-[12px] text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>

      <Section title="Kullanıcılar">
        <KpiCard label="Toplam kullanıcı" value={stats.totalProfiles} icon={faUsers} tone="navy" />
        <KpiCard label="Tekne sahipleri" value={stats.totalOwners} icon={faAnchor} tone="sky" />
        <KpiCard label="Kaptanlar" value={stats.totalCaptains} icon={faShieldHalved} tone="navy" />
        <KpiCard label="Organizatörler" value={0} sub="Yakında" icon={faClipboardList} tone="violet" />
      </Section>

      <Section title="İlanlar">
        <KpiCard label="Yayındaki ilanlar" value={stats.activeListings} icon={faCircleCheck} tone="green" />
        <KpiCard label="Onay bekleyen" value={stats.pendingListings} icon={faClock} tone="amber" />
        <KpiCard label="Askıya alınmış" value={stats.suspendedListings} icon={faCircleXmark} tone="red" />
        <KpiCard label="Bekleyen doğrulamalar" value={stats.pendingVerifications} icon={faShieldHalved} tone="amber" />
      </Section>

      <Section title="Rezervasyonlar">
        <KpiCard label="Toplam rezervasyon" value={stats.totalBookings} icon={faCalendarCheck} tone="navy" />
        <KpiCard label="Onaylı rezervasyonlar" value={stats.approvedBookings} icon={faCircleCheck} tone="green" />
        <KpiCard label="Bugünkü rezervasyonlar" value={stats.todayBookings} icon={faClock} tone="sky" />
        <KpiCard label="İptal oranı" value={`%${stats.cancellationRate}`} icon={faCircleXmark} tone="red" />
      </Section>

      <Section title="Finans">
        <KpiCard label="Toplam ciro" value={money(stats.totalRevenue)} icon={faWallet} tone="green" />
        <KpiCard
          label="Platform komisyonu"
          value={money(stats.platformCommission)}
          sub={`%${stats.commissionRate ?? 0} oran`}
          icon={faPercent}
          tone="sky"
        />
        <KpiCard label="Tamamlanan rezervasyon" value={stats.completedBookings} icon={faArrowTrendUp} tone="navy" />
        <KpiCard label="İptal edilen rezervasyon" value={stats.cancelledBookings} icon={faCircleXmark} tone="red" />
      </Section>

      {/* Grafikler */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-gray-200/70 bg-white p-5 shadow-card">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-ink">Rezervasyon trendi</h2>
              <p className="mt-0.5 text-[13px] text-gray-500">
                Bu dönemde <b className="font-semibold text-ink">{periodBookings}</b> rezervasyon
              </p>
            </div>
            <PeriodToggle period={period} onChange={setPeriod} />
          </div>
          <div className="flex h-36 items-end gap-1 border-b border-gray-100">
            {trendSlice.map((d) => (
              <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-md bg-brand-500/85 transition-colors group-hover:bg-brand-500"
                  style={{ height: `${Math.round((d.count / maxCount) * 100)}%`, minHeight: "3px" }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-xs font-medium text-white shadow-modal group-hover:block">
                  {d.date} · {d.count} rezervasyon · {money(d.revenue)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] font-medium text-gray-400">
            <span>{trendSlice[0]?.date}</span>
            <span>{trendSlice[trendSlice.length - 1]?.date}</span>
          </div>
        </div>

        <div className="rounded-card border border-gray-200/70 bg-white p-5 shadow-card">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-ink">Gelir ve komisyon</h2>
              <p className="mt-0.5 text-[13px] text-gray-500">
                Bu dönemde <b className="font-semibold text-ink">{money(periodRevenue)}</b> gelir
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1 text-[12.5px] font-medium text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                Gelir
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent-500" />
                Komisyon
              </span>
            </div>
          </div>
          <div className="flex h-36 items-end gap-1 border-b border-gray-100">
            {trendSlice.map((d) => (
              <div key={d.date} className="group relative flex h-full flex-1 items-end gap-px">
                <div
                  className="flex-1 rounded-t-md bg-green-500"
                  style={{
                    height: `${Math.round((d.revenue / maxRevenue) * 100)}%`,
                    minHeight: d.revenue > 0 ? "3px" : "0",
                  }}
                />
                <div
                  className="flex-1 rounded-t-md bg-accent-500"
                  style={{
                    height: `${Math.round((d.commission / maxRevenue) * 100)}%`,
                    minHeight: d.commission > 0 ? "3px" : "0",
                  }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-xs font-medium leading-5 text-white shadow-modal group-hover:block">
                  {d.date}
                  <br />
                  Gelir: {money(d.revenue)}
                  <br />
                  Komisyon: {money(d.commission)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] font-medium text-gray-400">
            <span>{trendSlice[0]?.date}</span>
            <span>{trendSlice[trendSlice.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Son aktiviteler */}
        <div className="rounded-card border border-gray-200/70 bg-white shadow-card lg:col-span-2">
          <div className="flex items-center justify-between px-5 pb-2 pt-5">
            <h2 className="text-[15px] font-bold text-ink">Son aktiviteler</h2>
            <Link href="/audit-log" className="text-[13px] font-semibold text-brand-500 hover:underline">
              Tümünü gör
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="px-5 pb-6 pt-2 text-sm text-gray-500">Henüz kayıtlı bir aktivite yok.</p>
          ) : (
            <ul className="px-2 pb-2">
              {recentActivity.slice(0, 6).map((log) => (
                <li key={log.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-cream">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-[12px] font-bold text-brand-500">
                    {log.admin.fullName.charAt(0).toLocaleUpperCase("tr-TR")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11.5px] text-gray-600">{log.action}</span>
                      {log.targetType && log.targetId && (
                        <span className="truncate text-[13.5px] text-gray-600">
                          {log.targetType} #{log.targetId.slice(0, 8)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-gray-400">{log.admin.fullName}</span>
                  </span>
                  <span className="shrink-0 text-[12px] font-medium text-gray-400">
                    {new Date(log.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Harita kısayolu */}
        <Link
          href="/map"
          className="group relative flex flex-col justify-between overflow-hidden rounded-card bg-brand-500 p-6 text-white shadow-card"
        >
          <span
            aria-hidden
            className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-accent-500/30 blur-2xl transition-transform group-hover:scale-110"
          />
          <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/15">
            <FontAwesomeIcon icon={faMapLocationDot} className="text-[18px]" aria-hidden />
          </span>
          <span className="relative mt-10 block">
            <span className="block text-[20px] font-extrabold leading-tight tracking-tight">Bölgeye göre ilan dağılımı</span>
            <span className="mt-2 block text-[14px] text-white/75">Aktif ilanları şehir ve ülkeye göre harita üzerinde gör.</span>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13.5px] font-bold text-brand-500">
              Haritayı aç
              <FontAwesomeIcon icon={faArrowRight} className="text-[11px] transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
