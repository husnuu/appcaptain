"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";

type ReportData = Awaited<ReturnType<typeof api.getFinanceReports>>;

const PERIOD_OPTIONS = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
];

const METHOD_LABELS: Record<string, string> = {
  card: "Kredi/Banka Kartı",
  bank_transfer: "Banka Transferi",
  paypal: "PayPal",
  stripe: "Stripe",
  unknown: "Bilinmiyor",
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("monthly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .getFinanceReports({ period, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [period, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const exportUrl = api.getFinanceReportsExportUrl({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });

  const fmtCurrency = (n: number) =>
    `€ ${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // For the bar chart — normalize to % of max
  const maxRevenue = data ? Math.max(...data.trend.map((r) => r.revenue), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Finans Raporları</h1>
        <a
          href={exportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          CSV İndir
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPeriod(opt.value)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${period === opt.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            {opt.label}
          </button>
        ))}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            title="Başlangıç tarihi"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            title="Bitiş tarihi"
          />
          {(dateFrom || dateTo) && (
            <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Temizle</button>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Summary totals */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Toplam Gelir" value={fmtCurrency(data.totals.revenue)} />
          <SummaryCard label="Platform Komisyonu" value={fmtCurrency(data.totals.commission)} color="text-emerald-700" />
          <SummaryCard label="Tekne Sahibi Net" value={fmtCurrency(data.totals.net)} />
          <SummaryCard label="İşlem Sayısı" value={String(data.totals.count)} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Yükleniyor…</p>
      ) : data && data.trend.length > 0 ? (
        <>
          {/* Revenue trend chart (CSS bar chart) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Gelir Trendi</h2>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1 min-h-[120px]" style={{ minWidth: `${data.trend.length * 36}px` }}>
                {data.trend.map((row) => {
                  const heightPct = (row.revenue / maxRevenue) * 100;
                  return (
                    <div key={row.date} className="flex flex-col items-center gap-1 flex-1 min-w-[32px]" title={`${row.date}: €${row.revenue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`}>
                      <div className="w-full rounded-t bg-brand-500 transition-all" style={{ height: `${Math.max(heightPct, 2)}px`, minHeight: "2px" }} />
                      <span className="text-[9px] text-gray-400 rotate-45 origin-left whitespace-nowrap">
                        {row.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Trend table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Dönem</th>
                  <th className="px-4 py-3 text-right">Gelir</th>
                  <th className="px-4 py-3 text-right">Komisyon</th>
                  <th className="px-4 py-3 text-right">Net</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                  <th className="px-4 py-3 text-right">İade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.trend.map((row) => (
                  <tr key={row.date} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.date}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{fmtCurrency(row.revenue)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">−{fmtCurrency(row.commission)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{fmtCurrency(row.net)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.count}</td>
                    <td className="px-4 py-3 text-right text-red-400">{row.refunds > 0 ? row.refunds : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment method breakdown */}
          {data.methodBreakdown.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">Ödeme Yöntemi Dağılımı</h2>
              <div className="space-y-3">
                {data.methodBreakdown.map((m) => {
                  const total = data.totals.revenue || 1;
                  const pct = Math.round((m.amount / total) * 100);
                  return (
                    <div key={m.method} className="flex items-center gap-3">
                      <span className="w-36 truncate text-sm text-gray-700">
                        {METHOD_LABELS[m.method] ?? m.method}
                      </span>
                      <div className="flex-1 rounded-full bg-gray-100 h-2">
                        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs text-gray-500">{pct}%</span>
                      <span className="w-28 text-right text-sm text-gray-700">{fmtCurrency(m.amount)}</span>
                      <span className="w-12 text-right text-xs text-gray-400">{m.count} işlem</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        !loading && <p className="py-12 text-center text-gray-400 text-sm">Seçilen dönemde ödeme verisi bulunamadı.</p>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color = "text-gray-900" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
