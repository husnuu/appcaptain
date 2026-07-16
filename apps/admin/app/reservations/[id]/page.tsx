"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "../../../lib/api";

type BookingDetail = Awaited<ReturnType<typeof api.getReservation>>["booking"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylı",
  CANCELLED: "İptal Edildi",
  REJECTED: "Reddedildi",
  COMPLETED: "Tamamlandı",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Ödeme Bekleniyor",
  PAID: "Ödendi",
  PAYOUT_SENT: "Kaptana Transfer Edildi",
  REFUNDED: "İade Edildi",
  FAILED: "Başarısız",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-emerald-100 text-emerald-700",
  PAYOUT_SENT: "bg-blue-100 text-blue-700",
  REFUNDED: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-100 text-red-700",
};

const RENTAL_TYPE_LABELS: Record<string, string> = {
  HOURLY: "Saatlik",
  DAILY: "Günlük",
  WEEKLY: "Haftalık",
  STAY: "Konaklama",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="w-40 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value ?? "—"}</span>
    </div>
  );
}

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Cancel modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelNote, setCancelNote] = useState("");

  // Refund modal
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundNote, setRefundNote] = useState("");
  const [refundResult, setRefundResult] = useState<{ amount: number; currency: string } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReservation(id);
      setBooking(res.booking);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancel() {
    setBusy(true);
    try {
      await api.cancelReservation(id, cancelNote || undefined);
      setCancelOpen(false);
      setCancelNote("");
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function handleRefund() {
    setBusy(true);
    try {
      const res = await api.refundReservation(id, refundNote || undefined);
      setRefundResult({ amount: res.payment.amount, currency: res.payment.currency });
      setRefundOpen(false);
      setRefundNote("");
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Yükleniyor…</div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  if (!booking) return null;

  const canCancel = booking.status !== "CANCELLED" && booking.status !== "COMPLETED";
  const canRefund = booking.bookingPayment !== null &&
    booking.bookingPayment.status !== "REFUNDED" &&
    booking.bookingPayment.status !== "PENDING";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button type="button" onClick={() => router.back()} className="mb-2 text-sm text-gray-400 hover:text-gray-600">
          ← Geri
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Rezervasyon Detayı</h1>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-600"}`}>
            {STATUS_LABELS[booking.status] ?? booking.status}
          </span>
          {booking.bookingPayment && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${PAYMENT_STATUS_COLORS[booking.bookingPayment.status] ?? "bg-gray-100 text-gray-600"}`}>
              {PAYMENT_STATUS_LABELS[booking.bookingPayment.status] ?? booking.bookingPayment.status}
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-400">
          ID: <span className="font-mono">{booking.id}</span>
          {" · "}Oluşturuldu: {new Date(booking.createdAt).toLocaleString("tr-TR")}
          {" · "}Son güncelleme: {new Date(booking.updatedAt).toLocaleString("tr-TR")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Guest Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Misafir Bilgileri</h2>
          <InfoRow label="Ad Soyad" value={booking.guestName} />
          <InfoRow label="E-posta" value={booking.guestEmail} />
          <InfoRow label="Telefon" value={booking.guestPhone} />
          <InfoRow label="Kişi Sayısı" value={booking.guestCount ? `${booking.guestCount} kişi` : null} />
          {booking.message && <InfoRow label="Mesaj" value={<span className="whitespace-pre-wrap">{booking.message}</span>} />}
        </div>

        {/* Boat & Owner Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Tekne ve Sahip</h2>
          <InfoRow
            label="Tekne"
            value={
              <Link href={`/boats/${booking.boat.id}`} className="font-medium text-brand-700 hover:underline">
                {booking.boat.title ?? booking.boat.id}
              </Link>
            }
          />
          {booking.boat.boatTypeKey && <InfoRow label="Tekne Tipi" value={booking.boat.boatTypeKey} />}
          <InfoRow
            label="Sahip"
            value={
              <Link href={`/users/${booking.boat.owner.id}`} className="text-brand-700 hover:underline">
                {booking.boat.owner.fullName ?? booking.boat.owner.email ?? "—"}
              </Link>
            }
          />
          {booking.boat.owner.email && <InfoRow label="Sahip E-posta" value={booking.boat.owner.email} />}
          {booking.boat.owner.phone && <InfoRow label="Sahip Telefon" value={booking.boat.owner.phone} />}
        </div>

        {/* Dates & Rental */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Tarih ve Rezervasyon</h2>
          <InfoRow label="Kiralama Türü" value={RENTAL_TYPE_LABELS[booking.rentalType] ?? booking.rentalType} />
          <InfoRow label="Başlangıç" value={
            <>
              {new Date(booking.startDate).toLocaleDateString("tr-TR")}
              {booking.startTime && <span className="ml-1 text-gray-500">{booking.startTime}</span>}
            </>
          } />
          {booking.endDate && (
            <InfoRow label="Bitiş" value={
              <>
                {new Date(booking.endDate).toLocaleDateString("tr-TR")}
                {booking.endTime && <span className="ml-1 text-gray-500">{booking.endTime}</span>}
              </>
            } />
          )}
          <InfoRow
            label="Toplam Tutar"
            value={
              booking.totalPrice != null
                ? <span className="text-lg font-bold text-gray-900">{booking.currency} {booking.totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                : null
            }
          />
          {booking.rejectionNote && (
            <InfoRow label="İptal Notu" value={<span className="text-red-600">{booking.rejectionNote}</span>} />
          )}
        </div>

        {/* Payment */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Ödeme Bilgileri</h2>
          {booking.bookingPayment ? (
            <>
              <InfoRow label="Ödeme Durumu" value={
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[booking.bookingPayment.status] ?? ""}`}>
                  {PAYMENT_STATUS_LABELS[booking.bookingPayment.status] ?? booking.bookingPayment.status}
                </span>
              } />
              <InfoRow label="Ödeme Yöntemi" value={booking.bookingPayment.method} />
              <InfoRow label="Brüt Tutar" value={`${booking.bookingPayment.currency} ${booking.bookingPayment.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`} />
              <InfoRow label="Platform Komisyonu" value={<span className="text-red-500">−{booking.bookingPayment.currency} {booking.bookingPayment.commission.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>} />
              <InfoRow label="Kaptana Net" value={<span className="font-semibold text-green-700">{booking.bookingPayment.currency} {booking.bookingPayment.netAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>} />
              {booking.bookingPayment.paidAt && <InfoRow label="Ödeme Tarihi" value={new Date(booking.bookingPayment.paidAt).toLocaleString("tr-TR")} />}
              {booking.bookingPayment.payoutAt && <InfoRow label="Transfer Tarihi" value={new Date(booking.bookingPayment.payoutAt).toLocaleString("tr-TR")} />}
              {booking.bookingPayment.invoiceUrl && (
                <InfoRow label="Fatura" value={<a href={booking.bookingPayment.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">Görüntüle</a>} />
              )}
              {booking.bookingPayment.note && <InfoRow label="Not" value={booking.bookingPayment.note} />}
            </>
          ) : (
            <p className="text-sm text-gray-400">Bu rezervasyon için ödeme kaydı yok.</p>
          )}
        </div>
      </div>

      {/* Admin Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Admin İşlemleri</h2>
        <div className="flex flex-wrap gap-3">
          {canCancel && (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Rezervasyonu İptal Et
            </button>
          )}
          {canRefund && (
            <button
              type="button"
              onClick={() => setRefundOpen(true)}
              className="rounded-lg border border-orange-400 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
            >
              İade Tetikle
            </button>
          )}
          {!canCancel && !canRefund && (
            <p className="text-sm text-gray-400">Bu rezervasyon için yapılabilecek işlem yok.</p>
          )}
        </div>
        {refundResult && (
          <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            İade tetiklendi: {refundResult.currency} {refundResult.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}. Gerçek ödeme iadesi için ödeme sağlayıcınızı kontrol edin.
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Rezervasyonu İptal Et</h2>
            <p className="mb-3 text-sm text-gray-500">Bu işlem geri alınamaz. Misafir ve kaptan bilgilendirilmeyecek (SMTP gerekir).</p>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              placeholder="İptal notu (opsiyonel)"
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setCancelOpen(false); setCancelNote(""); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
              <button type="button" disabled={busy} onClick={handleCancel} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                İptal Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">İade Tetikle</h2>
            <p className="mb-3 text-sm text-gray-500">
              Ödeme durumu &ldquo;İade Edildi&rdquo; olarak işaretlenir ve rezervasyon iptal edilir.
              Stripe iadesi <strong>otomatik yapılmaz</strong> — ödeme sağlayıcınızdan manuel olarak tetikleyin.
            </p>
            {booking.bookingPayment && (
              <div className="mb-3 rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
                İade edilecek tutar: <strong>{booking.bookingPayment.currency} {booking.bookingPayment.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong>
              </div>
            )}
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
              placeholder="İade notu (opsiyonel)"
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setRefundOpen(false); setRefundNote(""); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
              <button type="button" disabled={busy} onClick={handleRefund} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50">
                İadeyi Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
