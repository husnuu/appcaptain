"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type Payment = Awaited<ReturnType<typeof api.listPayments>>["items"][number];
type Summary = Awaited<ReturnType<typeof api.listPayments>>["summary"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  PAYOUT_SENT: "Transfer Gönderildi",
  REFUNDED: "İade Edildi",
  FAILED: "Başarısız",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  PAID: "bg-emerald-50 text-emerald-700",
  PAYOUT_SENT: "bg-blue-50 text-blue-700",
  REFUNDED: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-50 text-red-600",
};

const RENTAL_TYPE_LABELS: Record<string, string> = {
  HOURLY: "Saatlik",
  DAILY: "Günlük",
  WEEKLY: "Haftalık",
  STAY: "Konaklama",
};

export default function FinancePage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payout / refund modals
  const [payoutTarget, setPayoutTarget] = useState<Payment | null>(null);
  const [payoutAction, setPayoutAction] = useState<"approve" | "delay">("approve");
  const [payoutNote, setPayoutNote] = useState("");
  const [payoutBusy, setPayoutBusy] = useState(false);

  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [refundNote, setRefundNote] = useState("");
  const [refundBusy, setRefundBusy] = useState(false);

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api
      .listPayments({ status: status || undefined, search: search || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page, limit })
      .then((r) => { setItems(r.items); setTotal(r.total); setSummary(r.summary); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [status, search, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);

  async function handlePayout() {
    if (!payoutTarget) return;
    setPayoutBusy(true);
    try {
      await api.approvePayoutPayment(payoutTarget.id, { action: payoutAction, note: payoutNote || undefined });
      setPayoutTarget(null);
      setPayoutNote("");
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setPayoutBusy(false);
    }
  }

  async function handleRefund() {
    if (!refundTarget) return;
    setRefundBusy(true);
    try {
      await api.refundPayment(refundTarget.id, refundNote || undefined);
      setRefundTarget(null);
      setRefundNote("");
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setRefundBusy(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  const fmtAmount = (n: number, currency?: string | null) =>
    `${currency ?? "€"} ${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ödemeler</h1>
        <span className="text-sm text-gray-500">{total} kayıt</span>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Toplam Gelir" value={fmtAmount(summary.totalRevenue)} />
          <SummaryCard label="Platform Komisyonu" value={fmtAmount(summary.totalCommission)} color="text-emerald-700" />
          <SummaryCard label="Tekne Sahiplerine Net" value={fmtAmount(summary.totalNetAmount)} />
          <SummaryCard label="Global Komisyon Oranı" value={`%${summary.globalCommissionRate}`} />
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Misafir adı, e-posta veya tekne ara…"
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={(e) => { if (e.key === "Enter") load(); }}
          />
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" title="Başlangıç" />
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" title="Bitiş" />
          {(dateFrom || dateTo) && (
            <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Tarihi Temizle</button>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Misafir</th>
              <th className="px-4 py-3 text-left">Tekne / Sahip</th>
              <th className="px-4 py-3 text-left">Kiralama</th>
              <th className="px-4 py-3 text-right">Tutar</th>
              <th className="px-4 py-3 text-right">Komisyon</th>
              <th className="px-4 py-3 text-right">Net</th>
              <th className="px-4 py-3 text-left">Durum</th>
              <th className="px-4 py-3 text-left">Ödeme Tarihi</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Yükleniyor…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Sonuç bulunamadı</td></tr>
            ) : items.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{p.guestName}</div>
                  <div className="text-xs text-gray-400">{p.guestEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/boats/${p.booking.boat.id}`} className="font-medium text-brand-700 hover:underline">
                    {p.boatName}
                  </Link>
                  <div className="text-xs text-gray-400">
                    <Link href={`/users/${p.booking.boat.owner.id}`} className="hover:underline">
                      {p.booking.boat.owner.fullName ?? p.booking.boat.owner.email}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  <div>{RENTAL_TYPE_LABELS[p.booking.rentalType] ?? p.booking.rentalType}</div>
                  <div className="text-gray-400">{new Date(p.booking.startDate).toLocaleDateString("tr-TR")}</div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                  {fmtAmount(p.amount, p.currency)}
                </td>
                <td className="px-4 py-3 text-right text-orange-600 whitespace-nowrap">
                  −{fmtAmount(p.commission, p.currency)}
                </td>
                <td className="px-4 py-3 text-right text-emerald-700 whitespace-nowrap">
                  {fmtAmount(p.netAmount, p.currency)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  <div>{p.paidAt ? new Date(p.paidAt).toLocaleDateString("tr-TR") : "—"}</div>
                  {p.payoutAt && <div className="text-blue-500">Transfer: {new Date(p.payoutAt).toLocaleDateString("tr-TR")}</div>}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {p.status === "PAID" && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setPayoutTarget(p); setPayoutAction("approve"); setPayoutNote(""); }}
                          className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          Transfer Onayla
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPayoutTarget(p); setPayoutAction("delay"); setPayoutNote(""); }}
                          className="rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
                        >
                          Geciktir
                        </button>
                      </>
                    )}
                    {(p.status === "PAID" || p.status === "PAYOUT_SENT") && (
                      <button
                        type="button"
                        onClick={() => { setRefundTarget(p); setRefundNote(""); }}
                        className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                      >
                        İade
                      </button>
                    )}
                    <Link href={`/reservations/${p.bookingId}`} className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">
                      Rezervasyon
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-gray-100">←</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-gray-100">→</button>
          </div>
        </div>
      )}

      {/* Payout modal */}
      {payoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              {payoutAction === "approve" ? "Transfer Onayla" : "Ödemeyi Geciktir"}
            </h2>
            <p className="mb-1 text-sm text-gray-500">{payoutTarget.boatName}</p>
            <p className="mb-3 text-sm font-medium text-gray-900">{payoutTarget.booking.boat.owner.fullName} — {payoutTarget.currency} {payoutTarget.netAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
            {payoutAction === "delay" && (
              <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">Ödeme PAID durumunda kalır. Sahip daha sonra bilgilendirilmek için not eklenebilir.</p>
            )}
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              placeholder="Not (opsiyonel)"
              value={payoutNote}
              onChange={(e) => setPayoutNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPayoutTarget(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
              <button
                type="button"
                disabled={payoutBusy}
                onClick={handlePayout}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${payoutAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-yellow-500 hover:bg-yellow-600"}`}
              >
                {payoutAction === "approve" ? "Onayla" : "Geciktir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">İade Başlat</h2>
            <p className="mb-3 text-sm text-gray-500">{refundTarget.boatName}</p>
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <strong>Dikkat:</strong> Bu işlem yalnızca veritabanı kaydını günceller. Stripe üzerinden ödemeyi geri almak için Stripe Dashboard&apos;ı manuel olarak kullanmanız gerekir.
            </div>
            <p className="mb-3 text-sm font-medium text-gray-900">
              İade Tutarı: {refundTarget.currency} {refundTarget.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              placeholder="İade notu (opsiyonel)"
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setRefundTarget(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
              <button
                type="button"
                disabled={refundBusy}
                onClick={handleRefund}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                İadeyi Başlat
              </button>
            </div>
          </div>
        </div>
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
