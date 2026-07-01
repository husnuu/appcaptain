"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Alert,
  Button,
  EmptyState,
  FontAwesomeIcon,
  Modal,
  Select,
  Spinner,
  faAnchor,
  faArrowLeft,
  faArrowRight,
  faTrash,
} from "@getyourboat/ui";
import {
  BOOKING_MODEL_COLORS,
  BlockReason,
  BookingModel,
} from "@getyourboat/shared";
import type {
  BlockResponseDTO,
  MockReservationDTO,
} from "@getyourboat/shared";
import { useAuth } from "../../components/auth-provider";
import { AppShell } from "../../components/layout/AppShell";
import { api, ApiError } from "../../lib/api";
import { useMyBoats } from "../../lib/hooks";
import type { SerializedBoat } from "../../lib/types";

// Maps seeded listing model keys → BookingModel enum values
const KEY_TO_MODEL: Record<string, BookingModel> = {
  hourly: BookingModel.HOURLY,
  daily: BookingModel.DAILY,
  overnight: BookingModel.STAY_INCLUDED,
  weekly_charter: BookingModel.WEEKLY,
};

const MODEL_LABELS: Record<BookingModel, string> = {
  HOURLY: "Saatlik",
  DAILY: "Günlük",
  STAY_INCLUDED: "Konaklamalı",
  WEEKLY: "Haftalık",
};

const MODEL_UNIT: Record<BookingModel, string> = {
  HOURLY: "/saat",
  DAILY: "/gece",
  STAY_INCLUDED: "/gece",
  WEEKLY: "/hafta",
};

const REASON_LABELS: Record<string, string> = {
  MAINTENANCE: "Bakım",
  OWNER_USE: "Kişisel Kullanım",
  MANUAL: "Manuel Blokaj",
  OTHER: "Diğer",
};

// Booked (mock reservation) color
const BOOKED_COLOR = "#6366F1";

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

type ViewMode = "monthly" | "weekly" | "daily";

// Day cell data enriched with block model for coloring
type RichDay = {
  date: string;
  status: "AVAILABLE" | "BLOCKED" | "BOOKED";
  blockModel?: BookingModel;
};

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toYMD(d);
}

function getMondayOf(d: Date): string {
  const dow = d.getUTCDay();
  const offset = dow === 0 ? 6 : dow - 1;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - offset);
  return toYMD(monday);
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

// Build a map of date → { status, blockModel } from blocks + mock reservations
function buildDayMap(
  blocks: BlockResponseDTO[],
  mockReservations: MockReservationDTO[],
): Record<string, RichDay> {
  const map: Record<string, RichDay> = {};

  for (const block of blocks) {
    let cur = parseDate(block.startDate);
    const end = parseDate(block.endDate);
    while (cur <= end) {
      const d = toYMD(cur);
      if (!map[d]) map[d] = { date: d, status: "BLOCKED", blockModel: block.model as BookingModel };
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  for (const res of mockReservations) {
    let cur = parseDate(res.startDate);
    const end = parseDate(res.endDate);
    while (cur <= end) {
      const d = toYMD(cur);
      if (!map[d]) map[d] = { date: d, status: "BOOKED" };
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  return map;
}

// ─── Day cell (month / week grid) ─────────────────────────────────────────────

function DayCell({
  day,
  isPast,
  isRangeStart,
  isInHoverRange,
  isRangeEnd,
  price,
  onClick,
  onMouseEnter,
}: {
  day: RichDay;
  isPast: boolean;
  isRangeStart: boolean;
  isInHoverRange: boolean;
  isRangeEnd: boolean;
  price?: string;
  onClick: (day: RichDay) => void;
  onMouseEnter: () => void;
}) {
  const isBlocked = day.status === "BLOCKED";
  const isBooked = day.status === "BOOKED";
  const dateNum = Number(day.date.slice(8));

  let cls =
    "flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-lg text-sm font-medium transition-all ";
  let style: { backgroundColor: string } | undefined;

  if (isBlocked) {
    const color = day.blockModel ? BOOKING_MODEL_COLORS[day.blockModel] : "#EF4444";
    cls += isPast ? "cursor-default opacity-50 text-white" : "text-white";
    style = { backgroundColor: color };
  } else if (isBooked) {
    cls += isPast ? "cursor-default opacity-50 text-white" : "text-white";
    style = { backgroundColor: BOOKED_COLOR };
  } else if (isPast) {
    cls += "cursor-default text-white/20";
  } else if (isRangeStart || isRangeEnd) {
    cls += "bg-white font-semibold text-gray-900";
  } else if (isInHoverRange) {
    cls += "bg-white/20 text-white";
  } else {
    cls += "bg-white/5 text-white hover:bg-white/15";
  }

  const showPrice = price && !isBlocked && !isBooked && !isPast;

  return (
    <button
      onClick={() => onClick(day)}
      onMouseEnter={onMouseEnter}
      className={cls.trim()}
      style={style}
      disabled={isBooked || isPast}
      title={
        isBlocked
          ? `Blokeli${day.blockModel ? ` (${MODEL_LABELS[day.blockModel]})` : ""} — listeden kaldır`
          : isBooked
            ? "Rezervasyonlu (Mock)"
            : isRangeStart
              ? "Başlangıç seçildi — bitiş gününe tıkla (aynı güne tıkla → tek gün)"
              : undefined
      }
    >
      <span>{dateNum}</span>
      {showPrice && (
        <span className="text-[9px] font-normal leading-none text-white/60">{price}</span>
      )}
    </button>
  );
}

// ─── Monthly calendar ──────────────────────────────────────────────────────────

function MonthCalendar({
  year,
  month,
  dayMap,
  rangePickStart,
  hoverDate,
  price,
  onDayClick,
  onDayHover,
}: {
  year: number;
  month: number;
  dayMap: Record<string, RichDay>;
  rangePickStart: string | null;
  hoverDate: string | null;
  price?: string;
  onDayClick: (day: RichDay) => void;
  onDayHover: (date: string) => void;
}) {
  const today = toYMD(new Date());
  const firstOfMonth = toYMD(new Date(Date.UTC(year, month, 1)));
  const lastOfMonth = toYMD(new Date(Date.UTC(year, month + 1, 0)));

  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const leadOffset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const totalMain = leadOffset + daysInMonth;
  const trailOffset = totalMain % 7 === 0 ? 0 : 7 - (totalMain % 7);
  const totalCells = totalMain + trailOffset;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const date = toYMD(new Date(Date.UTC(year, month, 1 - leadOffset + i)));
    return {
      day: dayMap[date] ?? { date, status: "AVAILABLE" as const },
      isOverflow: date < firstOfMonth || date > lastOfMonth,
    };
  });

  const rangeMin =
    rangePickStart && hoverDate
      ? rangePickStart <= hoverDate ? rangePickStart : hoverDate
      : rangePickStart;
  const rangeMax =
    rangePickStart && hoverDate
      ? rangePickStart <= hoverDate ? hoverDate : rangePickStart
      : null;

  return (
    <div className="mt-4">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {DAY_NAMES.map((n) => (
          <div key={n} className="text-center text-caption font-semibold text-white/50">{n}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ day: cell, isOverflow }) => (
          <DayCell
            key={cell.date}
            day={cell}
            isPast={cell.date < today || isOverflow}
            isRangeStart={cell.date === rangePickStart}
            isRangeEnd={!!rangeMax && cell.date === rangeMax && cell.date !== rangePickStart}
            isInHoverRange={!!(rangeMin && rangeMax && cell.date > rangeMin && cell.date < rangeMax)}
            price={price}
            onClick={onDayClick}
            onMouseEnter={() => cell.date >= today && !isOverflow && onDayHover(cell.date)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Weekly calendar ───────────────────────────────────────────────────────────

function WeekCalendar({
  weekStart,
  dayMap,
  rangePickStart,
  hoverDate,
  price,
  onDayClick,
  onDayHover,
}: {
  weekStart: string;
  dayMap: Record<string, RichDay>;
  rangePickStart: string | null;
  hoverDate: string | null;
  price?: string;
  onDayClick: (day: RichDay) => void;
  onDayHover: (date: string) => void;
}) {
  const today = toYMD(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const rangeMin =
    rangePickStart && hoverDate
      ? rangePickStart <= hoverDate ? rangePickStart : hoverDate
      : rangePickStart;
  const rangeMax =
    rangePickStart && hoverDate
      ? rangePickStart <= hoverDate ? hoverDate : rangePickStart
      : null;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const jsDate = parseDate(date);
          const dayLabel = DAY_NAMES[jsDate.getUTCDay() === 0 ? 6 : jsDate.getUTCDay() - 1]!;
          const monthDay = `${jsDate.getUTCDate()} ${MONTH_NAMES[jsDate.getUTCMonth()]!.slice(0, 3)}`;
          return (
            <div key={date} className="flex flex-col gap-1">
              <div className="text-center text-caption font-semibold text-white/50">
                {dayLabel}
                <br />
                <span className="text-[10px] font-normal text-white/40">{monthDay}</span>
              </div>
              <DayCell
                day={dayMap[date] ?? { date, status: "AVAILABLE" }}
                isPast={date < today}
                isRangeStart={date === rangePickStart}
                isRangeEnd={!!rangeMax && date === rangeMax && date !== rangePickStart}
                isInHoverRange={!!(rangeMin && rangeMax && date > rangeMin && date < rangeMax)}
                price={price}
                onClick={onDayClick}
                onMouseEnter={() => date >= today && onDayHover(date)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Daily calendar (hourly timeline) ─────────────────────────────────────────

const DAILY_START = 8;
const DAILY_END = 22;

function DailyCalendar({
  date,
  blocks,
}: {
  date: string;
  blocks: BlockResponseDTO[];
}) {
  const today = toYMD(new Date());
  const isPastDay = date < today;

  // Filter blocks relevant to this day
  const dayBlocks = blocks.filter((b) => b.startDate <= date && b.endDate >= date);

  // For each hour slot, determine status
  const slots = Array.from({ length: DAILY_END - DAILY_START }, (_, i) => {
    const h = DAILY_START + i;
    const startTime = `${String(h).padStart(2, "0")}:00`;
    const endTime = `${String(h + 1).padStart(2, "0")}:00`;

    // Non-HOURLY block covers the entire day
    const fullDayBlock = dayBlocks.find((b) => b.model !== BookingModel.HOURLY);
    if (fullDayBlock) {
      return { startTime, endTime, status: "BLOCKED" as const, model: fullDayBlock.model as BookingModel };
    }

    // HOURLY block overlapping this slot
    const slotBlock = dayBlocks.find(
      (b) =>
        b.model === BookingModel.HOURLY &&
        b.startTime && b.endTime &&
        b.startTime < endTime && b.endTime > startTime,
    );
    if (slotBlock) {
      return { startTime, endTime, status: "BLOCKED" as const, model: BookingModel.HOURLY };
    }

    return { startTime, endTime, status: "AVAILABLE" as const, model: undefined };
  });

  return (
    <div className="mt-4 space-y-0.5">
      {slots.map(({ startTime, endTime, status, model }) => {
        const isBlocked = status === "BLOCKED";
        const color = model ? BOOKING_MODEL_COLORS[model] : undefined;
        return (
          <div
            key={startTime}
            className={[
              "flex items-center gap-3 rounded px-3 py-2 text-sm",
              isBlocked ? "text-white" : isPastDay ? "text-white/20" : "bg-white/5 text-white/70",
            ].join(" ")}
            style={isBlocked && color ? { backgroundColor: color } : undefined}
          >
            <span className="w-12 shrink-0 text-xs font-mono opacity-70">{startTime}</span>
            <span className="text-xs">
              {isBlocked
                ? `Blokeli${model ? ` — ${MODEL_LABELS[model]}` : ""}`
                : "Müsait"}
            </span>
            <span className="ml-auto text-xs opacity-50">{endTime}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Legend ────────────────────────────────────────────────────────────────────

function Legend({ models }: { models: BookingModel[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-3 text-caption text-white/70">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm bg-white/10" />
        Müsait
      </span>
      {models.map((m) => (
        <span key={m} className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: BOOKING_MODEL_COLORS[m] }}
          />
          {MODEL_LABELS[m]} Blokaj
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: BOOKED_COLOR }} />
        Rezervasyon (Mock)
      </span>
    </div>
  );
}

// ─── Create block modal ────────────────────────────────────────────────────────

function CreateBlockModal({
  boatId,
  availableModels,
  prefillStartDate,
  prefillEndDate,
  onClose,
  onCreated,
}: {
  boatId: string;
  availableModels: BookingModel[];
  prefillStartDate?: string;
  prefillEndDate?: string;
  onClose: () => void;
  onCreated: (block: BlockResponseDTO) => void;
}) {
  const [model, setModel] = useState<BookingModel>(availableModels[0] ?? BookingModel.DAILY);
  const isHourly = model === BookingModel.HOURLY;
  const [reason, setReason] = useState<string>(BlockReason.MANUAL);
  const [note, setNote] = useState("");
  const [startDate, setStartDate] = useState(prefillStartDate ?? "");
  const [endDate, setEndDate] = useState(prefillEndDate ?? "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const body = isHourly
        ? { boatId, model, reason: reason as BlockReason, note: note || undefined, date: startDate, startTime, endTime }
        : { boatId, model, reason: reason as BlockReason, note: note || undefined, startDate, endDate };
      const block = await api.createBlock(boatId, body);
      onCreated(block);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Blokaj oluşturulamadı");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Blokaj Ekle">
      <div className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}

        {availableModels.length > 1 && (
          <div>
            <label className="mb-1 block text-sm text-white/70">Model</label>
            <Select value={model} onChange={(e) => setModel(e.target.value as BookingModel)}>
              {availableModels.map((m) => (
                <option key={m} value={m}>{MODEL_LABELS[m]}</option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-white/70">Neden</label>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {Object.entries(REASON_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/70">Not (opsiyonel)</label>
          <input
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="Açıklama..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
        </div>

        {isHourly ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-white/70">Başlangıç</label>
              <input type="time" className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Bitiş</label>
              <input type="time" className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-white/70">Başlangıç</label>
              <input type="date" className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Bitiş</label>
              <input type="date" className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>İptal</Button>
          <Button onClick={submit} loading={saving}>Kaydet</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Pricing panel ─────────────────────────────────────────────────────────────

function PricingPanel({ boat }: { boat: SerializedBoat }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [localPricing, setLocalPricing] = useState(() =>
    Object.fromEntries(boat.pricing.map((p) => [p.listingModelKey, { price: p.price, currency: p.currency }]))
  );

  const models = boat.listingModels;

  async function save(modelKey: string) {
    const newPrice = parseFloat(editValue.replace(",", "."));
    if (isNaN(newPrice) || newPrice <= 0) return;
    setSaving(true);
    try {
      const updatedPricing = models.map((m) => {
        const existing = localPricing[m.key];
        return {
          listingModelKey: m.key,
          price: m.key === modelKey ? newPrice : (existing?.price ?? 0),
          currency: existing?.currency ?? "TRY",
        };
      });
      await api.updatePricing(boat.id, { pricing: updatedPricing });
      setLocalPricing((prev) => ({
        ...prev,
        [modelKey]: { price: newPrice, currency: prev[modelKey]?.currency ?? "TRY" },
      }));
      setEditing(null);
    } catch {
      // ignore — pricing is secondary to calendar
    } finally {
      setSaving(false);
    }
  }

  if (models.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="mb-3 text-sm font-semibold text-white/70">Temel Fiyatlar</h4>
      <div className="space-y-2">
        {models.map((m) => {
          const bm = KEY_TO_MODEL[m.key];
          const p = localPricing[m.key];
          const isEditing = editing === m.key;
          return (
            <div
              key={m.key}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: bm ? BOOKING_MODEL_COLORS[bm] : "#fff" }}
                />
                <span className="text-sm font-medium text-white">{m.label ?? MODEL_LABELS[bm ?? BookingModel.DAILY]}</span>
                {bm && <span className="text-xs text-white/40">{MODEL_UNIT[bm]}</span>}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <input
                      autoFocus
                      className="w-28 rounded border border-white/20 bg-white/10 px-2 py-1 text-right text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void save(m.key); if (e.key === "Escape") setEditing(null); }}
                    />
                    <Button size="sm" onClick={() => void save(m.key)} loading={saving}>✓</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>✕</Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-white">
                      {p ? formatPrice(p.price, p.currency) : "—"}
                    </span>
                    <button
                      onClick={() => { setEditing(m.key); setEditValue(String(p?.price ?? "")); }}
                      className="rounded px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white"
                    >
                      Düzenle
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mock reservation panel ────────────────────────────────────────────────────

function MockReservationPanel({
  boatId,
  reservations,
  onCreated,
  onDeleted,
}: {
  boatId: string;
  reservations: MockReservationDTO[];
  onCreated: (r: MockReservationDTO) => void;
  onDeleted: (id: string) => void;
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guestName, setGuestName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function submit() {
    if (!startDate || !endDate) { setError("Başlangıç ve bitiş tarihi gerekli"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await api.createMockReservation(boatId, {
        startDate,
        endDate,
        guestName: guestName || "Test Misafiri",
      });
      onCreated(res);
      setStartDate("");
      setEndDate("");
      setGuestName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Oluşturulamadı");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Bu test rezervasyonunu silmek istiyor musun?")) return;
    setBusyId(id);
    try {
      await api.deleteMockReservation(id);
      onDeleted(id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6">
      <h4 className="mb-3 text-sm font-semibold text-white/70">Test Rezervasyonu Ekle</h4>
      <p className="mb-3 text-xs text-white/40">
        Müşteri tarafı bağlanana kadar takvimde rezervasyon görünümünü test etmek için kullanın.
      </p>

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
          placeholder="Başlangıç"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
          placeholder="Bitiş"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <input
          type="text"
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
          placeholder="Misafir adı (opsiyonel)"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          maxLength={100}
        />
        <Button onClick={submit} loading={saving}>Ekle</Button>
      </div>

      {reservations.length > 0 && (
        <div className="mt-3 space-y-2">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <span className="text-sm font-medium text-white">
                  {r.startDate === r.endDate ? r.startDate : `${r.startDate} – ${r.endDate}`}
                </span>
                <p className="mt-0.5 text-caption text-white/50">{r.guestName}</p>
              </div>
              <Button
                size="sm"
                variant="danger"
                loading={busyId === r.id}
                onClick={() => void remove(r.id)}
              >
                <FontAwesomeIcon icon={faTrash} className="text-[12px]" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Block list ────────────────────────────────────────────────────────────────

function BlockList({
  blocks,
  onDelete,
}: {
  blocks: BlockResponseDTO[];
  onDelete: (id: string) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(id: string) {
    if (!window.confirm("Bu blokajı silmek istiyor musun?")) return;
    setBusyId(id);
    try {
      await api.deleteBlock(id);
      onDelete(id);
    } finally {
      setBusyId(null);
    }
  }

  if (blocks.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="mb-2 text-sm font-semibold text-white/70">Mevcut Blokajlar</h4>
      <div className="space-y-2">
        {blocks.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: BOOKING_MODEL_COLORS[b.model as BookingModel] ?? "#fff" }}
              />
              <div>
                <span className="text-sm font-medium text-white">
                  {b.startDate === b.endDate
                    ? b.startDate
                    : `${b.startDate} – ${b.endDate}`}
                  {b.startTime ? ` · ${b.startTime}–${b.endTime}` : ""}
                </span>
                <p className="mt-0.5 text-caption text-white/50">
                  {MODEL_LABELS[b.model as BookingModel] ?? b.model} · {REASON_LABELS[b.reason] ?? b.reason}
                  {b.note ? ` · ${b.note}` : ""}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="danger"
              loading={busyId === b.id}
              onClick={() => void remove(b.id)}
            >
              <FontAwesomeIcon icon={faTrash} className="text-[12px]" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main calendar view for a single boat ─────────────────────────────────────

function BoatCalendar({ boat }: { boat: SerializedBoat }) {
  const availableModels: BookingModel[] = boat.listingModels
    .map((m) => KEY_TO_MODEL[m.key])
    .filter((m): m is BookingModel => !!m);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [weekStart, setWeekStart] = useState<string>(() => getMondayOf(new Date()));
  const [currentDay, setCurrentDay] = useState<string>(() => toYMD(new Date()));

  // Data
  const [blocks, setBlocks] = useState<BlockResponseDTO[]>([]);
  const [mockReservations, setMockReservations] = useState<MockReservationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Range selection
  const [rangePickStart, setRangePickStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [pendingRange, setPendingRange] = useState<{ start: string; end: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setDataError(null);
    try {
      const [blocksData, mockData] = await Promise.all([
        api.listBlocks(boat.id),
        api.listMockReservations(boat.id),
      ]);
      setBlocks(blocksData);
      setMockReservations(mockData);
    } catch (err) {
      setDataError(err instanceof ApiError ? err.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [boat.id]);

  useEffect(() => { void loadData(); }, [loadData]);

  // Build universal day status map
  const dayMap = useMemo(() => buildDayMap(blocks, mockReservations), [blocks, mockReservations]);

  // Primary display price (first model with pricing)
  const primaryPrice = useMemo(() => {
    for (const m of availableModels) {
      const key = Object.entries(KEY_TO_MODEL).find(([, v]) => v === m)?.[0];
      const p = boat.pricing.find((bp) => bp.listingModelKey === key);
      if (p) return formatPrice(p.price, p.currency);
    }
    return undefined;
  }, [availableModels, boat.pricing]);

  const today = toYMD(new Date());

  function handleDayClick(day: RichDay) {
    if (day.date < today) return;
    if (day.status === "BOOKED") return;
    if (day.status === "BLOCKED") {
      setRangePickStart(null);
      setHoverDate(null);
      return;
    }

    if (!rangePickStart) {
      setRangePickStart(day.date);
      setHoverDate(day.date);
    } else if (day.date === rangePickStart) {
      // Same day second click → single-day block
      setPendingRange({ start: day.date, end: day.date });
      setRangePickStart(null);
      setHoverDate(null);
    } else {
      const s = rangePickStart <= day.date ? rangePickStart : day.date;
      const e = rangePickStart <= day.date ? day.date : rangePickStart;
      setPendingRange({ start: s, end: e });
      setRangePickStart(null);
      setHoverDate(null);
    }
  }

  function handleDayHover(date: string) {
    if (rangePickStart && date >= today) setHoverDate(date);
  }

  function handleBlockCreated(block: BlockResponseDTO) {
    setPendingRange(null);
    setBlocks((prev) => [...prev, block]);
  }

  function handleBlockDeleted(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function handleMockCreated(res: MockReservationDTO) {
    setMockReservations((prev) => [...prev, res]);
  }

  function handleMockDeleted(id: string) {
    setMockReservations((prev) => prev.filter((r) => r.id !== id));
  }

  // Navigation labels + prev/next handlers
  let navLabel = "";
  function prevPeriod() {
    if (viewMode === "monthly") {
      if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1);
    } else if (viewMode === "weekly") {
      setWeekStart((ws) => addDays(ws, -7));
    } else {
      setCurrentDay((d) => addDays(d, -1));
    }
    setRangePickStart(null); setHoverDate(null);
  }
  function nextPeriod() {
    if (viewMode === "monthly") {
      if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1);
    } else if (viewMode === "weekly") {
      setWeekStart((ws) => addDays(ws, 7));
    } else {
      setCurrentDay((d) => addDays(d, 1));
    }
    setRangePickStart(null); setHoverDate(null);
  }

  if (viewMode === "monthly") {
    navLabel = `${MONTH_NAMES[month]} ${year}`;
  } else if (viewMode === "weekly") {
    const ws = parseDate(weekStart);
    const we = addDays(weekStart, 6);
    const weParsed = parseDate(we);
    navLabel = ws.getUTCMonth() === weParsed.getUTCMonth()
      ? `${ws.getUTCDate()}–${weParsed.getUTCDate()} ${MONTH_NAMES[ws.getUTCMonth()]} ${ws.getUTCFullYear()}`
      : `${ws.getUTCDate()} ${MONTH_NAMES[ws.getUTCMonth()]!.slice(0,3)} – ${weParsed.getUTCDate()} ${MONTH_NAMES[weParsed.getUTCMonth()]!.slice(0,3)} ${weParsed.getUTCFullYear()}`;
  } else {
    const d = parseDate(currentDay);
    navLabel = `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }

  return (
    <div>
      {/* Top bar: navigation + view switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h3 className="min-w-[180px] text-center text-base font-semibold text-white">{navLabel}</h3>
          <button onClick={nextPeriod} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>

        {/* View mode dropdown */}
        <select
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white focus:outline-none"
          value={viewMode}
          onChange={(e) => { setViewMode(e.target.value as ViewMode); setRangePickStart(null); setHoverDate(null); }}
        >
          <option value="monthly">Aylık</option>
          <option value="weekly">Haftalık</option>
          <option value="daily">Günlük</option>
        </select>
      </div>

      {rangePickStart && (
        <p className="mt-3 text-sm text-white/60">
          {rangePickStart} seçildi — bitiş gününe tıkla (aynı güne tekrar tıkla → tek günlük blok)
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : dataError ? (
        <Alert variant="danger" className="mt-4">{dataError}</Alert>
      ) : viewMode === "monthly" ? (
        <MonthCalendar
          year={year}
          month={month}
          dayMap={dayMap}
          rangePickStart={rangePickStart}
          hoverDate={hoverDate}
          price={primaryPrice}
          onDayClick={handleDayClick}
          onDayHover={handleDayHover}
        />
      ) : viewMode === "weekly" ? (
        <WeekCalendar
          weekStart={weekStart}
          dayMap={dayMap}
          rangePickStart={rangePickStart}
          hoverDate={hoverDate}
          price={primaryPrice}
          onDayClick={handleDayClick}
          onDayHover={handleDayHover}
        />
      ) : (
        <DailyCalendar date={currentDay} blocks={blocks} />
      )}

      <Legend models={availableModels} />

      {/* Pricing panel */}
      <PricingPanel boat={boat} />

      {/* Block list */}
      <BlockList blocks={blocks} onDelete={handleBlockDeleted} />

      {/* Mock reservation panel */}
      <MockReservationPanel
        boatId={boat.id}
        reservations={mockReservations}
        onCreated={handleMockCreated}
        onDeleted={handleMockDeleted}
      />

      {/* Create block modal */}
      {pendingRange && (
        <CreateBlockModal
          boatId={boat.id}
          availableModels={availableModels}
          prefillStartDate={pendingRange.start}
          prefillEndDate={pendingRange.end}
          onClose={() => setPendingRange(null)}
          onCreated={handleBlockCreated}
        />
      )}
    </div>
  );
}

// ─── Page content ──────────────────────────────────────────────────────────────

function CalendarContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryEnabled = !authLoading && isAuthenticated;
  const { data: boats, loading: boatsLoading } = useMyBoats(queryEnabled);

  const [selectedBoatId, setSelectedBoatId] = useState<string>("");
  const [boat, setBoat] = useState<SerializedBoat | null>(null);
  const [boatLoading, setBoatLoading] = useState(false);

  useEffect(() => {
    if (!selectedBoatId && boats && boats.length > 0) {
      setSelectedBoatId(boats[0]!.id);
    }
  }, [boats, selectedBoatId]);

  useEffect(() => {
    if (!selectedBoatId) return;
    setBoatLoading(true);
    api.getBoat(selectedBoatId)
      .then((b) => setBoat(b))
      .catch(() => setBoat(null))
      .finally(() => setBoatLoading(false));
  }, [selectedBoatId]);

  if (authLoading || boatsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={faAnchor}
        title="Giriş gerekli"
        description="Takvimi görmek için giriş yapmalısınız."
      />
    );
  }

  if (!boats || boats.length === 0) {
    return (
      <EmptyState
        icon={faAnchor}
        title="Tekne bulunamadı"
        description="Takvimi kullanmak için önce bir tekne ekleyin."
      />
    );
  }

  return (
    <div className="space-y-6">
      {boats.length > 1 && (
        <Select
          value={selectedBoatId}
          onChange={(e) => setSelectedBoatId(e.target.value)}
        >
          {boats.map((b) => (
            <option key={b.id} value={b.id}>{b.title ?? b.id}</option>
          ))}
        </Select>
      )}

      {boatLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : boat ? (
        <BoatCalendar boat={boat} />
      ) : null}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  return (
    <AppShell active="calendar">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-ink-800 px-6 py-8">
          <h1 className="mb-6 text-2xl font-bold text-white">Tekne Takvimi</h1>
          <CalendarContent />
        </div>
      </div>
    </AppShell>
  );
}
