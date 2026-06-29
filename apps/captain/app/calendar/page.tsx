"use client";

import { useEffect, useState, useCallback } from "react";
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
  AvailabilityMap,
  BlockResponseDTO,
  CalendarDay,
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

const REASON_LABELS: Record<string, string> = {
  MAINTENANCE: "Bakım",
  OWNER_USE: "Kişisel Kullanım",
  MANUAL: "Manuel Blokaj",
  OTHER: "Diğer",
};

// Single universal color for any blocked cell, regardless of which model created the block
const BLOCKED_COLOR = "#EF4444";

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Expands to full Monday→Sunday weeks so overflow days have real availability data
function calendarRange(year: number, month: number): { start: string; end: string } {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const firstDow = firstDay.getUTCDay();
  const leadOffset = firstDow === 0 ? 6 : firstDow - 1;
  const lastDow = lastDay.getUTCDay();
  const trailOffset = lastDow === 0 ? 0 : 7 - lastDow;
  return {
    start: toYMD(new Date(Date.UTC(year, month, 1 - leadOffset))),
    end: toYMD(new Date(Date.UTC(year, month + 1, trailOffset))),
  };
}

// ─── Day status cell ───────────────────────────────────────────────────────────

function DayCell({
  day,
  isPast,
  isOverflow,
  isRangeStart,
  isInHoverRange,
  isRangeEnd,
  onClick,
  onMouseEnter,
}: {
  day: CalendarDay;
  isPast: boolean;
  isOverflow: boolean;
  isRangeStart: boolean;
  isInHoverRange: boolean;
  isRangeEnd: boolean;
  onClick: (day: CalendarDay) => void;
  onMouseEnter: () => void;
}) {
  const isBlocked = day.status === "BLOCKED";
  const isBooked = day.status === "BOOKED";
  const dateNum = Number(day.date.slice(8));
  const muted = isPast || isOverflow;

  let cls =
    "flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-all ";
  let style: { backgroundColor: string } | undefined;

  if (isBlocked) {
    cls += muted ? "cursor-default text-white/50" : "text-white";
    style = { backgroundColor: BLOCKED_COLOR + (muted ? "88" : "") };
  } else if (isBooked) {
    cls += "cursor-default bg-white/10 text-white/40";
  } else if (isPast) {
    cls += "cursor-default text-white/20";
  } else if (isRangeStart || isRangeEnd) {
    cls += "bg-white font-semibold text-gray-900";
  } else if (isInHoverRange) {
    cls += "bg-white/20 text-white";
  } else {
    cls += "bg-white/5 text-white hover:bg-white/15";
  }

  return (
    <button
      onClick={() => onClick(day)}
      onMouseEnter={onMouseEnter}
      className={cls.trim()}
      style={style}
      disabled={isBooked || isPast}
      title={
        muted
          ? isBlocked
            ? `Blokeli (${isPast ? "geçmiş" : "diğer ay"})`
            : isBooked
              ? `Rezervasyonlu (${isPast ? "geçmiş" : "diğer ay"})`
              : undefined
          : isBlocked
            ? "Blokeli — listeden kaldır"
            : isBooked
              ? "Rezervasyonlu"
              : isRangeStart
                ? "Başlangıç seçildi — bitiş gününe tıkla"
                : "Tıkla → seç"
      }
    >
      {dateNum}
    </button>
  );
}

// ─── Month calendar ────────────────────────────────────────────────────────────

function MonthCalendar({
  year,
  month,
  days,
  rangePickStart,
  hoverDate,
  onDayClick,
  onDayHover,
}: {
  year: number;
  month: number;
  days: CalendarDay[];
  rangePickStart: string | null;
  hoverDate: string | null;
  onDayClick: (day: CalendarDay) => void;
  onDayHover: (date: string) => void;
}) {
  const today = toYMD(new Date());
  const firstOfMonth = toYMD(new Date(Date.UTC(year, month, 1)));
  const lastOfMonth = toYMD(new Date(Date.UTC(year, month + 1, 0)));
  const dayMap = Object.fromEntries(days.map((d) => [d.date, d]));

  // Monday-first lead offset
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const leadOffset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const totalMain = leadOffset + daysInMonth;
  const trailOffset = totalMain % 7 === 0 ? 0 : 7 - (totalMain % 7);
  const totalCells = totalMain + trailOffset;

  // Build full-week grid — negative/overflow day indices roll across month boundaries correctly
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const date = toYMD(new Date(Date.UTC(year, month, 1 - leadOffset + i)));
    return {
      day: dayMap[date] ?? { date, status: "AVAILABLE" as const },
      isOverflow: date < firstOfMonth || date > lastOfMonth,
    };
  });

  // Resolve the visual range min/max for hover preview
  const rangeMin =
    rangePickStart && hoverDate
      ? rangePickStart <= hoverDate
        ? rangePickStart
        : hoverDate
      : rangePickStart;
  const rangeMax =
    rangePickStart && hoverDate
      ? rangePickStart <= hoverDate
        ? hoverDate
        : rangePickStart
      : null;

  return (
    <div className="mt-4">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {DAY_NAMES.map((n) => (
          <div key={n} className="text-center text-caption font-semibold text-white/50">
            {n}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ day: cell, isOverflow }) => (
          <DayCell
            key={cell.date}
            day={cell}
            isPast={cell.date < today}
            isOverflow={isOverflow}
            isRangeStart={cell.date === rangePickStart}
            isRangeEnd={!!rangeMax && cell.date === rangeMax && cell.date !== rangePickStart}
            isInHoverRange={
              !!(rangeMin && rangeMax && cell.date > rangeMin && cell.date < rangeMax)
            }
            onClick={onDayClick}
            onMouseEnter={() => cell.date >= today && onDayHover(cell.date)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Legend ────────────────────────────────────────────────────────────────────

function Legend({ model }: { model: BookingModel }) {
  return (
    <div className="mt-4 flex flex-wrap gap-3 text-caption text-white/70">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm bg-white/10" />
        Müsait
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-3 w-3 rounded-sm"
          style={{ backgroundColor: BLOCKED_COLOR }}
        />
        Blokeli
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-3 w-3 rounded-sm"
          style={{ backgroundColor: BOOKING_MODEL_COLORS[model] }}
        />
        {MODEL_LABELS[model]} Rezervasyon
      </span>
    </div>
  );
}

// ─── Create block modal ────────────────────────────────────────────────────────

function CreateBlockModal({
  boatId,
  model,
  prefillStartDate,
  prefillEndDate,
  onClose,
  onCreated,
}: {
  boatId: string;
  model: BookingModel;
  prefillStartDate?: string;
  prefillEndDate?: string;
  onClose: () => void;
  onCreated: (block: BlockResponseDTO) => void;
}) {
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
              <input
                type="time"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Bitiş</label>
              <input
                type="time"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-white/70">Başlangıç</label>
              <input
                type="date"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Bitiş</label>
              <input
                type="date"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
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

// ─── Main calendar view for a single boat ─────────────────────────────────────

function BoatCalendar({ boat }: { boat: SerializedBoat }) {
  const availableModels: BookingModel[] = boat.listingModels
    .map((m) => KEY_TO_MODEL[m.key])
    .filter((m): m is BookingModel => !!m);

  const [model, setModel] = useState<BookingModel>(availableModels[0] ?? BookingModel.DAILY);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [availability, setAvailability] = useState<AvailabilityMap | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);

  // Two-click date range selection (Skyscanner-style)
  const [rangePickStart, setRangePickStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [pendingRange, setPendingRange] = useState<{ start: string; end: string } | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [blockListKey, setBlockListKey] = useState(0);

  const { start, end } = calendarRange(year, month);

  const loadAvailability = useCallback(async () => {
    setLoadingAvail(true);
    setAvailError(null);
    try {
      const data = await api.getAvailability(boat.id, model, start, end);
      setAvailability(data);
    } catch (err) {
      setAvailError(err instanceof ApiError ? err.message : "Yüklenemedi");
    } finally {
      setLoadingAvail(false);
    }
  }, [boat.id, model, start, end]);

  useEffect(() => {
    void loadAvailability();
    // Reset range pick when model or month changes
    setRangePickStart(null);
    setHoverDate(null);
  }, [loadAvailability]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const today = toYMD(new Date());

  function handleDayClick(day: CalendarDay) {
    // Past days are view-only — only allow deleting a future block
    if (day.date < today) return;

    if (day.status === "BLOCKED") {
      if (day.blockId && window.confirm("Bu blokajı kaldırmak istiyor musun?")) {
        void deleteBlock(day.blockId);
      }
      setRangePickStart(null);
      setHoverDate(null);
      return;
    }
    if (day.status === "BOOKED") return;

    if (!rangePickStart) {
      // First click — select start
      setRangePickStart(day.date);
      setHoverDate(day.date);
    } else if (day.date === rangePickStart) {
      // Clicked the same date again — deselect
      setRangePickStart(null);
      setHoverDate(null);
    } else {
      // Second click — confirm range and open modal
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

  async function deleteBlock(blockId: string) {
    setActionError(null);
    try {
      await api.deleteBlock(blockId);
      setBlockListKey((k) => k + 1);
      await loadAvailability();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Silinemedi");
    }
  }

  function handleBlockCreated() {
    setPendingRange(null);
    setBlockListKey((k) => k + 1);
    void loadAvailability();
  }

  return (
    <div>
      {/* Model tabs */}
      {availableModels.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {availableModels.map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                model === m
                  ? "text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20",
              ].join(" ")}
              style={model === m ? { backgroundColor: BOOKING_MODEL_COLORS[m] } : undefined}
            >
              {MODEL_LABELS[m]}
            </button>
          ))}
        </div>
      )}

      {actionError && (
        <div className="mb-3">
          <Alert variant="danger">{actionError}</Alert>
        </div>
      )}

      {/* Range selection hint */}
      {rangePickStart && (
        <p className="mb-3 text-sm text-white/60">
          {rangePickStart} seçildi — bitiş gününe tıkla
        </p>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h3 className="text-base font-semibold text-white">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button onClick={nextMonth} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>

      {loadingAvail ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : availError ? (
        <Alert variant="danger" className="mt-4">{availError}</Alert>
      ) : availability ? (
        <MonthCalendar
          year={year}
          month={month}
          days={availability.days ?? []}
          rangePickStart={rangePickStart}
          hoverDate={hoverDate}
          onDayClick={handleDayClick}
          onDayHover={handleDayHover}
        />
      ) : null}

      <Legend model={model} />

      {/* Blocks list — shows all blocks regardless of model */}
      <BlockList boatId={boat.id} refreshKey={blockListKey} onRefresh={loadAvailability} />

      {/* Create block modal — opens after second click confirms a range */}
      {pendingRange && (
        <CreateBlockModal
          boatId={boat.id}
          model={model}
          prefillStartDate={pendingRange.start}
          prefillEndDate={pendingRange.end}
          onClose={() => setPendingRange(null)}
          onCreated={handleBlockCreated}
        />
      )}
    </div>
  );
}

// ─── Block list ────────────────────────────────────────────────────────────────

function BlockList({
  boatId,
  refreshKey,
  onRefresh,
}: {
  boatId: string;
  refreshKey: number;
  onRefresh: () => void;
}) {
  const [blocks, setBlocks] = useState<BlockResponseDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBlocks(await api.listBlocks(boatId));
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [boatId]);

  useEffect(() => { void load(); }, [load, refreshKey]);

  async function remove(id: string) {
    if (!window.confirm("Bu blokajı silmek istiyor musun?")) return;
    setBusyId(id);
    try {
      await api.deleteBlock(id);
      setBlocks((prev) => prev?.filter((b) => b.id !== id) ?? []);
      onRefresh();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return null;
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="mb-2 text-sm font-semibold text-white/70">Mevcut Blokajlar</h4>
      <div className="space-y-2">
        {blocks.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            <div>
              <span className="text-sm font-medium text-white">
                {b.startDate === b.endDate
                  ? b.startDate
                  : `${b.startDate} – ${b.endDate}`}
                {b.startTime ? ` · ${b.startTime}–${b.endTime}` : ""}
              </span>
              <p className="mt-0.5 text-caption text-white/50">
                {REASON_LABELS[b.reason] ?? b.reason}
                {b.note ? ` · ${b.note}` : ""}
              </p>
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

// ─── Page content ──────────────────────────────────────────────────────────────

function CalendarContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryEnabled = !authLoading && isAuthenticated;
  const { data: boats, loading: boatsLoading } = useMyBoats(queryEnabled);

  const [selectedBoatId, setSelectedBoatId] = useState<string>("");
  const [boat, setBoat] = useState<SerializedBoat | null>(null);
  const [boatLoading, setBoatLoading] = useState(false);

  // Auto-select first boat
  useEffect(() => {
    if (!selectedBoatId && boats && boats.length > 0) {
      setSelectedBoatId(boats[0]!.id);
    }
  }, [boats, selectedBoatId]);

  // Load full boat when selection changes
  useEffect(() => {
    if (!selectedBoatId) return;
    setBoat(null);
    setBoatLoading(true);
    api.getBoat(selectedBoatId)
      .then(setBoat)
      .catch(() => setBoat(null))
      .finally(() => setBoatLoading(false));
  }, [selectedBoatId]);

  const selectedBoatHasModels = boat && boat.listingModels.length > 0;

  return (
    <div className="rounded-card bg-ink-800 p-5 text-white shadow-card sm:p-6">
      <div className="mb-6">
        <h1 className="text-heading text-white">Takvim</h1>
        <p className="mt-1 text-body-sm text-white/70">
          Tekne bazlı blokaj yönetimi ve müsaitlik takvimi.
        </p>
      </div>

      {boatsLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !boats || boats.length === 0 ? (
        <EmptyState
          icon={faAnchor}
          title="Henüz bir teknen yok"
          description="Takvim yönetimi için önce bir tekne ekle."
          className="border-white/10 bg-white/5 [&_h3]:text-white [&_p]:text-white/70 [&_svg]:text-white/50"
        />
      ) : (
        <>
          {/* Boat selector */}
          {boats.length > 1 && (
            <div className="mb-6">
              <label className="mb-1 block text-sm text-white/70">Tekne</label>
              <Select
                value={selectedBoatId}
                onChange={(e) => setSelectedBoatId(e.target.value)}
                className="max-w-xs"
              >
                {boats.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title || "İsimsiz taslak"}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {boatLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !boat ? null : !selectedBoatHasModels ? (
            <Alert variant="info">
              Bu tekne için henüz kiralama modeli seçilmemiş. Takvimi kullanmak için önce tekneyi düzenle ve bir model seç.
            </Alert>
          ) : (
            <BoatCalendar boat={boat} />
          )}
        </>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AppShell active="calendar">
      <CalendarContent />
    </AppShell>
  );
}
