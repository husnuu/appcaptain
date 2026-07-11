"use client";

import {
  Alert,
  Button,
  FontAwesomeIcon,
  faCalendarCheck,
  faCalendarDays,
  faCheck,
  faEnvelope,
  faPhone,
  faSpinner,
  faUsers,
  faXmark,
} from "@getyourboat/ui";
import { useEffect, useMemo, useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  BookingStatus,
  RENTAL_TYPE_LABELS,
  formatBookingPrice,
  type BookingDTO,
} from "@getyourboat/shared";
import { AppShell } from "../../components/layout/AppShell";
import { useAuth } from "../../components/auth-provider";
import { Field, Input, Modal, Textarea } from "../../components/ui";
import { api, ApiError } from "../../lib/api";

type StatusFilter = BookingStatus | "ALL";

const STATUS_FILTERS: StatusFilter[] = [
  "ALL",
  BookingStatus.PENDING,
  BookingStatus.APPROVED,
  BookingStatus.REJECTED,
  BookingStatus.CANCELLED,
  BookingStatus.COMPLETED,
];

const STATUS_BADGE: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "bg-amber-50 text-amber-700 border-amber-200",
  [BookingStatus.APPROVED]: "bg-green-50 text-green-700 border-green-200",
  [BookingStatus.REJECTED]: "bg-red-50 text-red-600 border-red-200",
  [BookingStatus.CANCELLED]: "bg-gray-50 text-gray-600 border-gray-200",
  [BookingStatus.COMPLETED]: "bg-blue-50 text-blue-700 border-blue-200",
};

function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function BookingCard({
  booking,
  onApprove,
  onReject,
  busy,
}: {
  booking: BookingDTO;
  onApprove: (b: BookingDTO) => void;
  onReject: (b: BookingDTO) => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-ink">{booking.guestName}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-body-sm text-gray-500">
            <FontAwesomeIcon icon={faEnvelope} className="text-[12px]" aria-hidden />
            {booking.guestEmail}
          </p>
          {booking.guestPhone ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-body-sm text-gray-500">
              <FontAwesomeIcon icon={faPhone} className="text-[12px]" aria-hidden />
              {booking.guestPhone}
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1.5 text-caption font-semibold ${
            STATUS_BADGE[booking.status]
          }`}
        >
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
      </div>

      {booking.boat?.name ? (
        <p className="mb-3 text-body-sm font-medium text-gray-700">{booking.boat.name}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3">
        <FontAwesomeIcon icon={faCalendarDays} className="text-[15px] text-brand-600" aria-hidden />
        <span className="text-body-sm font-medium text-gray-700">
          {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-caption text-gray-500">
          <FontAwesomeIcon icon={faUsers} className="text-[12px]" aria-hidden />
          {booking.guestCount} kişi · {RENTAL_TYPE_LABELS[booking.rentalType]}
        </span>
      </div>

      {booking.totalPrice != null ? (
        <p className="mb-3 text-body-sm text-gray-600">
          Fiyat:{" "}
          <span className="font-semibold text-ink">
            {formatBookingPrice(booking.totalPrice, booking.currency)}
          </span>
        </p>
      ) : null}

      {booking.message ? (
        <p className="mb-4 rounded-xl bg-brand-50/60 p-3 text-body-sm italic text-gray-600">
          “{booking.message}”
        </p>
      ) : null}

      {booking.status === BookingStatus.REJECTED && booking.rejectionNote ? (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-body-sm text-red-600">
          Red nedeni: {booking.rejectionNote}
        </p>
      ) : null}

      {booking.status === BookingStatus.PENDING ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onApprove(booking)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-body-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faCheck} className="text-[13px]" aria-hidden />
            Onayla
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReject(booking)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-red-200 bg-white py-2.5 text-body-sm font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faXmark} className="text-[13px]" aria-hidden />
            Reddet
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BookingsContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<BookingDTO | null>(null);
  const [rejectTarget, setRejectTarget] = useState<BookingDTO | null>(null);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listCaptainBookings({ limit: 100 });
      setBookings(res.bookings);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rezervasyonlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(
    () => (filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );
  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === BookingStatus.PENDING).length,
    [bookings]
  );

  async function handleApprove(id: string, totalPrice?: number | null) {
    setBusyId(id);
    try {
      const { booking } = await api.approveBooking(id, totalPrice ?? undefined);
      setBookings((list) => list.map((b) => (b.id === id ? booking : b)));
      setApproveTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Onaylanamadı");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string, note?: string | null) {
    setBusyId(id);
    try {
      const { booking } = await api.rejectBooking(id, note ?? undefined);
      setBookings((list) => list.map((b) => (b.id === id ? booking : b)));
      setRejectTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reddedilemedi");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Rezervasyonlar</h1>
        <p className="mt-1 text-body-sm text-gray-500">
          Teknelerine gelen rezervasyon taleplerini onayla veya reddet.
          {pendingCount > 0 ? (
            <span className="ml-1 font-semibold text-brand-600">
              {pendingCount} bekleyen talep.
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const activeChip = filter === s;
          const label = s === "ALL" ? "Tümü" : BOOKING_STATUS_LABELS[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full border px-4 py-1.5 text-body-sm font-medium transition-colors ${
                activeChip
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <FontAwesomeIcon icon={faCalendarCheck} className="mb-3 text-[28px] text-gray-300" aria-hidden />
          <p className="font-semibold text-ink">Henüz rezervasyon talebi yok</p>
          <p className="mt-1 text-body-sm text-gray-500">
            İlanların yayına alındığında gelen talepler burada görünecek.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              busy={busyId === b.id}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
            />
          ))}
        </div>
      )}

      {approveTarget ? (
        <ApproveModal
          booking={approveTarget}
          busy={busyId === approveTarget.id}
          onClose={() => setApproveTarget(null)}
          onConfirm={(price) => handleApprove(approveTarget.id, price)}
        />
      ) : null}

      {rejectTarget ? (
        <RejectModal
          booking={rejectTarget}
          busy={busyId === rejectTarget.id}
          onClose={() => setRejectTarget(null)}
          onConfirm={(note) => handleReject(rejectTarget.id, note)}
        />
      ) : null}
    </div>
  );
}

function ApproveModal({
  booking,
  busy,
  onClose,
  onConfirm,
}: {
  booking: BookingDTO;
  busy: boolean;
  onClose: () => void;
  onConfirm: (totalPrice: number | null) => void;
}) {
  const [price, setPrice] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title="Rezervasyonu onayla"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button
            onClick={() => onConfirm(price ? Number(price) : null)}
            disabled={busy}
          >
            {busy ? (
              <FontAwesomeIcon icon={faSpinner} spin className="text-[14px]" aria-hidden />
            ) : (
              <FontAwesomeIcon icon={faCheck} className="text-[14px]" aria-hidden />
            )}
            Onayla
          </Button>
        </>
      }
    >
      <p className="mb-4 text-body-sm text-gray-600">
        <span className="font-semibold text-ink">{booking.guestName}</span> için{" "}
        {formatDate(booking.startDate)} – {formatDate(booking.endDate)} tarihli talebi
        onaylıyorsun. İstersen toplam fiyatı belirtebilirsin.
      </p>
      <Field label={`Toplam fiyat (${booking.currency}) — opsiyonel`}>
        <Input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Örn. 1500"
        />
      </Field>
    </Modal>
  );
}

function RejectModal({
  booking,
  busy,
  onClose,
  onConfirm,
}: {
  booking: BookingDTO;
  busy: boolean;
  onClose: () => void;
  onConfirm: (note: string | null) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title="Rezervasyonu reddet"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(note.trim() || null)}
            disabled={busy}
          >
            {busy ? (
              <FontAwesomeIcon icon={faSpinner} spin className="text-[14px]" aria-hidden />
            ) : (
              <FontAwesomeIcon icon={faXmark} className="text-[14px]" aria-hidden />
            )}
            Reddet
          </Button>
        </>
      }
    >
      <p className="mb-4 text-body-sm text-gray-600">
        <span className="font-semibold text-ink">{booking.guestName}</span> adlı misafirin
        talebini reddediyorsun. İstersen bir açıklama ekleyebilirsin.
      </p>
      <Field label="Red nedeni — opsiyonel">
        <Textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Örn. Bu tarihler dolu."
        />
      </Field>
    </Modal>
  );
}

export default function BookingsPage() {
  return (
    <AppShell active="bookings">
      <BookingsContent />
    </AppShell>
  );
}
