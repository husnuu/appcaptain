"use client";

import { useEffect, useState } from "react";
import {
  FontAwesomeIcon,
  faArrowTrendUp,
  faClock,
  faFilter,
  faPercent,
  faReceipt,
  faSpinner,
  faWallet,
  type IconDefinition,
} from "@getyourboat/ui";
import {
  BOOKING_PAYMENT_STATUS_LABELS,
  BookingPaymentStatus,
  formatBookingPaymentAmount,
  type BookingPaymentDTO,
  type BookingPaymentStats,
} from "@getyourboat/shared";
import { AppShell } from "../../components/layout/AppShell";
import { api, ApiError } from "../../lib/api";

const STATUS_STYLE: Record<
  BookingPaymentStatus,
  { bg: string; text: string; border: string }
> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  PAID: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  PAYOUT_SENT: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  REFUNDED: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  FAILED: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
};

const FILTERS: Array<{ value: "" | BookingPaymentStatus; label: string }> = [
  { value: "", label: "Tümü" },
  { value: BookingPaymentStatus.PENDING, label: "Bekleniyor" },
  { value: BookingPaymentStatus.PAID, label: "Ödendi" },
  { value: BookingPaymentStatus.PAYOUT_SENT, label: "Hesabınızda" },
  { value: BookingPaymentStatus.REFUNDED, label: "İade" },
];

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: IconDefinition;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
        <FontAwesomeIcon icon={icon} className={color} aria-hidden />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{label}</p>
    </div>
  );
}

function PaymentsContent() {
  const [payments, setPayments] = useState<BookingPaymentDTO[]>([]);
  const [stats, setStats] = useState<BookingPaymentStats | null>(null);
  const [filter, setFilter] = useState<"" | BookingPaymentStatus>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void api
      .listPayments(filter ? { status: filter } : {})
      .then((data) => {
        if (!active) return;
        setPayments(data.payments);
        setStats(data.stats);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Ödemeler yüklenemedi");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  const cards = stats
    ? [
        {
          label: "Bu Ay Kazanç",
          value: formatBookingPaymentAmount(stats.monthlyEarnings, "EUR"),
          icon: faArrowTrendUp,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "Ödeme Bekleyen",
          value: formatBookingPaymentAmount(stats.pendingPayout, "EUR"),
          icon: faClock,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          label: "Toplam Brüt",
          value: formatBookingPaymentAmount(stats.totalRevenue, "EUR"),
          icon: faWallet,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "Platform Komisyonu",
          value: formatBookingPaymentAmount(stats.totalCommission, "EUR"),
          icon: faPercent,
          color: "text-gray-500",
          bg: "bg-gray-50",
        },
      ]
    : [];

  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FontAwesomeIcon icon={faFilter} className="text-xs text-gray-400" aria-hidden />
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.value
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-brand-500" aria-hidden />
          </div>
        ) : error ? (
          <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-red-600">
            {error}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center px-6 text-center">
            <FontAwesomeIcon icon={faReceipt} className="mb-3 text-3xl text-gray-300" aria-hidden />
            <p className="font-medium text-gray-500">Henüz ödeme yok</p>
            <p className="mt-1 text-sm text-gray-400">
              Rezervasyon onayladığınızda beklenen kazançlarınız burada listelenir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Misafir", "Tekne", "Tarih", "Brüt", "Net (Size)", "Durum"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => {
                  const s = STATUS_STYLE[p.status];
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">{p.guestName}</p>
                        <p className="text-xs text-gray-400">{p.guestEmail}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">{p.boatName}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(p.createdAt).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-gray-900">
                          {formatBookingPaymentAmount(p.amount, p.currency)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Komisyon: {formatBookingPaymentAmount(p.commission, p.currency)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-green-600">
                          {formatBookingPaymentAmount(p.netAmount, p.currency)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {BOOKING_PAYMENT_STATUS_LABELS[p.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          Ödemeler rezervasyon onaylandıktan sonra platform üzerinden tahsil edilir. Net kazancınız
          rezervasyon tamamlandıktan sonra 3-5 iş günü içinde hesabınıza aktarılır.
        </p>
      </div>
    </>
  );
}

export default function PaymentsPage() {
  return (
    <AppShell active="payments">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Ödemeler</h1>
        <p className="mt-1 text-sm text-gray-600">Kazançlarınız ve ödeme durumlarınız</p>
      </div>
      <PaymentsContent />
    </AppShell>
  );
}
