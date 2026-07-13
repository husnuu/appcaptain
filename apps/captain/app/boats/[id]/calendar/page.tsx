"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FontAwesomeIcon,
  faArrowLeft,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faPlus,
  faSpinner,
  faTrash,
} from "@getyourboat/ui";
import {
  BlockReason,
  CalendarModel,
  SlotStatus,
  calendarModelColor,
  calendarModelLabel,
  isHourlyModel,
  type AvailabilityMap,
} from "@getyourboat/shared";
import { Protected, TopBar } from "../../../../components/protected";
import { useAuth } from "../../../../components/auth-provider";
import { Alert, Spinner } from "../../../../components/ui";
import { api, ApiError } from "../../../../lib/api";
import type { SerializedBoat } from "../../../../lib/types";

type CalendarView = "month" | "week" | "day";
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

/** Local-date 'YYYY-MM-DD' — avoids the UTC day-shift that toISOString() causes at UTC+3. */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getViewRange(view: CalendarView, date: Date): { start: string; end: string } {
  if (view === "month") {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    // Pad to full weeks (Mon-start) so the grid edges resolve too.
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const start = new Date(first);
    start.setDate(first.getDate() - startPad);
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - (last.getDay() === 0 ? 6 : last.getDay() - 1)));
    return { start: ymd(start), end: ymd(end) };
  }
  if (view === "week") {
    const monday = new Date(date);
    monday.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: ymd(monday), end: ymd(sunday) };
  }
  return { start: ymd(date), end: ymd(date) };
}

function formatCurrentLabel(view: CalendarView, date: Date): string {
  if (view === "month")
    return date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  if (view === "week") {
    const monday = new Date(date);
    monday.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.getDate()} – ${sunday.getDate()} ${sunday.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}`;
  }
  return date.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
}

interface CellMenuState {
  open: boolean;
  x: number;
  y: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  currentPrice?: number;
  blockId?: string;
  status?: SlotStatus;
}

interface BlockModalState {
  open: boolean;
  date?: string;
  startTime?: string;
  endTime?: string;
}

export default function BoatCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: boatId } = use(params);
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [boat, setBoat] = useState<SerializedBoat | null>(null);
  const [model, setModel] = useState<string>(CalendarModel.WEEKLY_CHARTER);
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cellMenu, setCellMenu] = useState<CellMenuState>({ open: false, x: 0, y: 0 });
  const [blockModal, setBlockModal] = useState<BlockModalState>({ open: false });

  const modelKeys = useMemo(
    () => (boat?.listingModels ?? []).map((m) => m.key),
    [boat]
  );

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    void api
      .getBoat(boatId)
      .then((data) => {
        if (cancelled) return;
        setBoat(data);
        const first = data.listingModels?.[0]?.key;
        if (first) setModel(first);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Tekne yüklenemedi");
      });
    return () => {
      cancelled = true;
    };
  }, [boatId, authLoading, isAuthenticated]);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { start, end } = getViewRange(view, currentDate);
    try {
      const data = await api.getCalendarAvailability(boatId, {
        rangeStart: start,
        rangeEnd: end,
        model,
      });
      setAvailability(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Takvim yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [boatId, model, view, currentDate]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void fetchAvailability();
  }, [fetchAvailability, authLoading, isAuthenticated]);

  useEffect(() => {
    const close = () => setCellMenu((m) => ({ ...m, open: false }));
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const navigate = (dir: "prev" | "next") => {
    setCurrentDate((d) => {
      const next = new Date(d);
      if (view === "month") next.setMonth(d.getMonth() + (dir === "next" ? 1 : -1));
      else if (view === "week") next.setDate(d.getDate() + (dir === "next" ? 7 : -7));
      else next.setDate(d.getDate() + (dir === "next" ? 1 : -1));
      return next;
    });
  };

  const handleCellClick = (
    e: React.MouseEvent,
    date: string,
    startTime?: string,
    endTime?: string,
    currentPrice?: number,
    blockId?: string,
    status?: SlotStatus
  ) => {
    e.stopPropagation();
    setCellMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      date,
      startTime,
      endTime,
      currentPrice,
      blockId,
      status,
    });
  };

  const colors = calendarModelColor(model);

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50">
        <TopBar />

        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <button
            onClick={() => router.push(`/boats/${boatId}`)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" aria-hidden />
            Düzenlemeye dön
          </button>

          <div className="mx-1 h-6 w-px bg-gray-200" />

          <button
            onClick={() => navigate("prev")}
            className="rounded-xl p-2 hover:bg-gray-100"
            aria-label="Önceki"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-sm" aria-hidden />
          </button>
          <h2 className="min-w-[180px] text-center text-lg font-bold text-gray-900">
            {formatCurrentLabel(view, currentDate)}
          </h2>
          <button
            onClick={() => navigate("next")}
            className="rounded-xl p-2 hover:bg-gray-100"
            aria-label="Sonraki"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-sm" aria-hidden />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            Bugün
          </button>

          <div className="flex-1" />

          {modelKeys.length > 1 && (
            <div className="flex items-center gap-1.5">
              {modelKeys.map((key) => {
                const active = key === model;
                const c = calendarModelColor(key);
                return (
                  <button
                    key={key}
                    onClick={() => setModel(key)}
                    className="rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
                    style={
                      active
                        ? { background: c.light, color: c.text, borderColor: c.border }
                        : { background: "white", color: "#6B7280", borderColor: "#E5E7EB" }
                    }
                  >
                    {calendarModelLabel(key)}
                  </button>
                );
              })}
            </div>
          )}
          {modelKeys.length <= 1 && (
            <span
              className="rounded-full border px-3 py-1.5 text-xs font-bold"
              style={{ background: colors.light, color: colors.text, borderColor: colors.border }}
            >
              {calendarModelLabel(model)}
            </span>
          )}

          <ViewDropdown view={view} onChange={setView} />

          <button
            onClick={() => setBlockModal({ open: true })}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" aria-hidden /> Blokaj Ekle
          </button>
        </div>

        <Legend activeModel={model} />

        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          )}
          {!loading && availability && (
            <>
              {view === "month" && (
                <MonthView
                  availability={availability}
                  model={model}
                  currentDate={currentDate}
                  onCellClick={handleCellClick}
                />
              )}
              {view === "week" && (
                <WeekView
                  availability={availability}
                  model={model}
                  currentDate={currentDate}
                  onCellClick={handleCellClick}
                />
              )}
              {view === "day" && (
                <DayView
                  availability={availability}
                  model={model}
                  currentDate={currentDate}
                  onCellClick={handleCellClick}
                />
              )}
            </>
          )}
        </div>

        {cellMenu.open && (
          <CellContextMenu
            menu={cellMenu}
            boatId={boatId}
            model={model}
            defaultPrice={availability?.defaultPrice}
            currency={availability?.currency ?? "EUR"}
            onClose={() => setCellMenu((m) => ({ ...m, open: false }))}
            onRefresh={fetchAvailability}
            onAddBlock={(date, startTime, endTime) => {
              setCellMenu((m) => ({ ...m, open: false }));
              setBlockModal({ open: true, date, startTime, endTime });
            }}
          />
        )}

        {blockModal.open && (
          <CreateBlockModal
            boatId={boatId}
            model={model}
            initialDate={blockModal.date}
            initialStartTime={blockModal.startTime}
            initialEndTime={blockModal.endTime}
            onClose={() => setBlockModal({ open: false })}
            onCreated={fetchAvailability}
          />
        )}
      </div>
    </Protected>
  );
}

type CellClickHandler = (
  e: React.MouseEvent,
  date: string,
  startTime?: string,
  endTime?: string,
  currentPrice?: number,
  blockId?: string,
  status?: SlotStatus
) => void;

interface ViewProps {
  availability: AvailabilityMap;
  model: string;
  currentDate: Date;
  onCellClick: CellClickHandler;
}

function Legend({ activeModel }: { activeModel: string }) {
  const models = [
    CalendarModel.HOURLY,
    CalendarModel.DAILY,
    CalendarModel.OVERNIGHT,
    CalendarModel.WEEKLY_CHARTER,
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-gray-100 bg-white px-4 py-2 sm:px-6">
      {models.map((m) => (
        <div key={m} className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{
              background: calendarModelColor(m).bg,
              outline: m === activeModel ? "2px solid rgba(0,0,0,0.15)" : "none",
              outlineOffset: 1,
            }}
          />
          <span className="text-xs text-gray-500">{calendarModelLabel(m)}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-gray-300" />
        <span className="text-xs text-gray-500">Blokaj</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="text-xs text-gray-500">Dolu</span>
      </div>
    </div>
  );
}

function MonthView({ availability, model, currentDate, onCellClick }: ViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const cursor = new Date(first);
  cursor.setDate(first.getDate() - startPad);

  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    let lastDay = new Date(cursor);
    for (let d = 0; d < 7; d++) {
      lastDay = new Date(cursor);
      week.push(lastDay);
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (w >= 3 && lastDay.getMonth() !== month) break;
  }

  const dayMap = new Map((availability.days ?? []).map((d) => [d.date, d]));
  const colors = calendarModelColor(model);
  const today = ymd(new Date());

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-3 text-center text-xs font-bold uppercase text-gray-400">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
          {week.map((day, di) => {
            const dateStr = ymd(day);
            const info = dayMap.get(dateStr);
            const isOtherMonth = day.getMonth() !== month;
            const isToday = dateStr === today;
            const bg =
              info?.status === SlotStatus.BLOCKED
                ? "#F3F4F6"
                : info?.status === SlotStatus.BOOKED
                  ? "#FEE2E2"
                  : "white";
            const dot =
              info?.status === SlotStatus.BLOCKED
                ? "#9CA3AF"
                : info?.status === SlotStatus.BOOKED
                  ? "#EF4444"
                  : colors.bg;
            return (
              <div
                key={di}
                onClick={(e) =>
                  onCellClick(e, dateStr, undefined, undefined, info?.basePrice, info?.blockId, info?.status)
                }
                className={`group relative min-h-[80px] cursor-pointer border-r border-gray-100 p-2 transition-colors last:border-0 hover:bg-gray-50 ${isOtherMonth ? "opacity-30" : ""}`}
                style={{ background: bg }}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${isToday ? "bg-brand-600 font-bold text-white" : "font-medium text-gray-700 group-hover:bg-gray-200"}`}
                >
                  {day.getDate()}
                </span>
                {info?.basePrice != null && (
                  <p className="mt-1 text-[10px] font-bold" style={{ color: colors.text }}>
                    €{info.basePrice}
                  </p>
                )}
                {info && info.status !== SlotStatus.AVAILABLE && (
                  <div
                    className="absolute bottom-2 right-2 h-2 w-2 rounded-full"
                    style={{ background: dot }}
                  />
                )}
                {info?.status === SlotStatus.BLOCKED && (
                  <p className="mt-0.5 text-[10px] text-gray-400">Bloke</p>
                )}
                {info?.status === SlotStatus.BOOKED && (
                  <p className="mt-0.5 text-[10px] text-red-500">Dolu</p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WeekView({ availability, model, currentDate, onCellClick }: ViewProps) {
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  const colors = calendarModelColor(model);
  const today = ymd(new Date());

  if (isHourlyModel(model)) {
    const slotMap = new Map(
      (availability.slots ?? []).map((s) => [`${s.date}|${s.startTime}`, s])
    );
    const hours = Array.from({ length: 9 }, (_, i) => i + 9);
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="border-r border-gray-100 py-3" />
          {days.map((d, i) => (
            <div key={i} className="border-r border-gray-100 py-3 text-center last:border-0">
              <p className="text-xs text-gray-400">{WEEKDAYS[i]}</p>
              <p className={`mt-0.5 text-lg font-bold ${ymd(d) === today ? "text-brand-600" : "text-gray-900"}`}>
                {d.getDate()}
              </p>
            </div>
          ))}
        </div>
        {hours.map((h) => (
          <div key={h} className="grid grid-cols-8 border-b border-gray-100 last:border-0">
            <div className="border-r border-gray-100 px-3 py-2 text-right text-xs text-gray-400">
              {String(h).padStart(2, "0")}:00
            </div>
            {days.map((d, di) => {
              const dateStr = ymd(d);
              const startTime = `${String(h).padStart(2, "0")}:00`;
              const endTime = `${String(h + 1).padStart(2, "0")}:00`;
              const slot = slotMap.get(`${dateStr}|${startTime}`);
              const bg =
                slot?.status === SlotStatus.BLOCKED
                  ? colors.light
                  : slot?.status === SlotStatus.BOOKED
                    ? "#FEE2E2"
                    : "transparent";
              return (
                <div
                  key={di}
                  onClick={(e) =>
                    onCellClick(e, dateStr, startTime, endTime, slot?.basePrice, slot?.blockId, slot?.status)
                  }
                  className="min-h-[44px] cursor-pointer border-r border-gray-100 px-1.5 py-2 transition-colors last:border-0 hover:bg-gray-50"
                  style={{ background: bg }}
                >
                  {slot?.status === SlotStatus.BLOCKED && (
                    <p className="text-[10px] font-semibold" style={{ color: colors.text }}>
                      Bloke
                    </p>
                  )}
                  {slot?.status === SlotStatus.BOOKED && (
                    <p className="text-[10px] font-semibold text-red-500">Dolu</p>
                  )}
                  {slot?.basePrice != null && (
                    <p className="text-[10px] text-gray-500">€{slot.basePrice}</p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  const dayMap = new Map((availability.days ?? []).map((d) => [d.date, d]));
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const dateStr = ymd(d);
          const info = dayMap.get(dateStr);
          const isToday = dateStr === today;
          const bg =
            info?.status === SlotStatus.BLOCKED
              ? "#F3F4F6"
              : info?.status === SlotStatus.BOOKED
                ? "#FEE2E2"
                : "white";
          return (
            <div
              key={i}
              onClick={(e) =>
                onCellClick(e, dateStr, undefined, undefined, info?.basePrice, info?.blockId, info?.status)
              }
              className="cursor-pointer border-r border-gray-100 transition-opacity last:border-0 hover:opacity-90"
              style={{ background: bg }}
            >
              <div className="border-b border-gray-100 px-3 py-3 text-center">
                <p className="text-xs text-gray-400">{WEEKDAYS[i]}</p>
                <p className={`mt-0.5 text-xl font-bold ${isToday ? "text-brand-600" : "text-gray-900"}`}>
                  {d.getDate()}
                </p>
              </div>
              <div className="min-h-[120px] p-3">
                {info?.status === SlotStatus.BLOCKED && (
                  <p className="text-xs font-semibold text-gray-500">🔒 Bloke</p>
                )}
                {info?.status === SlotStatus.BOOKED && (
                  <p className="text-xs font-semibold text-red-500">● Dolu</p>
                )}
                {info?.basePrice != null && (
                  <p className="mt-2 text-sm font-bold" style={{ color: colors.text }}>
                    €{info.basePrice}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ availability, model, currentDate, onCellClick }: ViewProps) {
  const dateStr = ymd(currentDate);
  const colors = calendarModelColor(model);

  if (isHourlyModel(model)) {
    const slots = (availability.slots ?? []).filter((s) => s.date === dateStr);
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <h3 className="font-bold text-gray-900">
            {currentDate.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {slots.map((slot) => {
            const bg =
              slot.status === SlotStatus.BLOCKED
                ? colors.light
                : slot.status === SlotStatus.BOOKED
                  ? "#FEE2E2"
                  : "white";
            return (
              <div
                key={`${slot.startTime}-${slot.endTime}`}
                onClick={(e) =>
                  onCellClick(e, dateStr, slot.startTime, slot.endTime, slot.basePrice, slot.blockId, slot.status)
                }
                className="flex cursor-pointer items-center px-6 py-4 hover:bg-gray-50"
                style={{ background: bg }}
              >
                <span className="w-28 font-mono text-sm text-gray-500">
                  {slot.startTime} – {slot.endTime}
                </span>
                <span
                  className={`text-sm font-semibold ${slot.status === SlotStatus.BLOCKED ? "text-gray-500" : slot.status === SlotStatus.BOOKED ? "text-red-500" : "text-green-600"}`}
                >
                  {slot.status === SlotStatus.BLOCKED
                    ? "🔒 Bloke"
                    : slot.status === SlotStatus.BOOKED
                      ? "● Dolu"
                      : "✓ Müsait"}
                </span>
                {slot.basePrice != null && (
                  <span className="ml-auto text-sm font-bold" style={{ color: colors.text }}>
                    €{slot.basePrice}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const info = (availability.days ?? []).find((d) => d.date === dateStr);
  const bg =
    info?.status === SlotStatus.BLOCKED
      ? colors.light
      : info?.status === SlotStatus.BOOKED
        ? "#FEE2E2"
        : "white";
  return (
    <div
      onClick={(e) =>
        onCellClick(e, dateStr, undefined, undefined, info?.basePrice, info?.blockId, info?.status)
      }
      className="cursor-pointer rounded-2xl border border-gray-200 p-8"
      style={{ background: bg }}
    >
      <h3 className="mb-4 text-xl font-bold text-gray-900">
        {currentDate.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </h3>
      <p
        className={`text-lg font-semibold ${info?.status === SlotStatus.BLOCKED ? "text-gray-500" : info?.status === SlotStatus.BOOKED ? "text-red-500" : "text-green-600"}`}
      >
        {info?.status === SlotStatus.BLOCKED
          ? "🔒 Bu gün bloke"
          : info?.status === SlotStatus.BOOKED
            ? "● Bu gün dolu"
            : "✓ Müsait"}
      </p>
      {info?.basePrice != null && (
        <p className="mt-4 text-2xl font-bold" style={{ color: colors.text }}>
          €{info.basePrice} / {calendarModelLabel(model)}
        </p>
      )}
    </div>
  );
}

function CellContextMenu({
  menu,
  boatId,
  model,
  defaultPrice,
  currency,
  onClose,
  onRefresh,
  onAddBlock,
}: {
  menu: CellMenuState;
  boatId: string;
  model: string;
  defaultPrice?: number;
  currency: string;
  onClose: () => void;
  onRefresh: () => void;
  onAddBlock: (date?: string, startTime?: string, endTime?: string) => void;
}) {
  const [priceInput, setPriceInput] = useState(String(menu.currentPrice ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetPrice = async () => {
    const price = parseFloat(priceInput);
    if (Number.isNaN(price) || price <= 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.setCalendarPriceOverride(boatId, {
        date: menu.date!,
        startTime: menu.startTime,
        endTime: menu.endTime,
        price,
        currency,
      });
      onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fiyat kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async () => {
    if (!menu.blockId) return;
    setSaving(true);
    try {
      await api.deleteCalendarBlock(menu.blockId);
      onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Blokaj kaldırılamadı.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed z-50 w-64 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl"
      style={{
        left: Math.min(menu.x, (typeof window !== "undefined" ? window.innerWidth : 1024) - 280),
        top: Math.min(menu.y, (typeof window !== "undefined" ? window.innerHeight : 768) - 320),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
        {menu.date}
        {menu.startTime ? ` · ${menu.startTime}–${menu.endTime}` : ""}
      </p>

      <div
        className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${menu.status === SlotStatus.BLOCKED ? "bg-gray-100 text-gray-600" : menu.status === SlotStatus.BOOKED ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
      >
        {menu.status === SlotStatus.BLOCKED
          ? "🔒 Bloke"
          : menu.status === SlotStatus.BOOKED
            ? "● Dolu"
            : "✓ Müsait"}
      </div>

      {menu.status !== SlotStatus.BOOKED && (
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Baz Fiyat</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder={defaultPrice != null ? String(defaultPrice) : "Varsayılan"}
                className="w-full rounded-xl border border-gray-200 py-2 pl-7 pr-3 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSetPrice}
              disabled={saving}
              className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "..." : "Ayarla"}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-gray-400">Model: {calendarModelLabel(model)}</p>
        </div>
      )}

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      <hr className="mb-3 border-gray-100" />

      {menu.status === SlotStatus.BLOCKED && menu.blockId && (
        <button
          onClick={handleUnblock}
          disabled={saving}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faTrash} className="text-xs" aria-hidden /> Blokajı Kaldır
        </button>
      )}

      {menu.status === SlotStatus.AVAILABLE && (
        <button
          onClick={() => onAddBlock(menu.date, menu.startTime, menu.endTime)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" aria-hidden /> Blokaj Ekle
        </button>
      )}
    </div>
  );
}

const REASON_LABELS: Record<string, string> = {
  [BlockReason.MAINTENANCE]: "🔧 Bakım",
  [BlockReason.OWNER_USE]: "⚓ Kaptan Kullanımı",
  [BlockReason.MANUAL]: "🔒 Manuel Blokaj",
  [BlockReason.OTHER]: "📌 Diğer",
};

function CreateBlockModal({
  boatId,
  model,
  initialDate,
  initialStartTime,
  initialEndTime,
  onClose,
  onCreated,
}: {
  boatId: string;
  model: string;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const isHourly = isHourlyModel(model);
  const [form, setForm] = useState({
    date: initialDate ?? "",
    startDate: initialDate ?? "",
    endDate: initialDate ?? "",
    startTime: initialStartTime ?? "09:00",
    endTime: initialEndTime ?? "10:00",
    reason: BlockReason.MANUAL as string,
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.createCalendarBlock(boatId, {
        reason: form.reason as BlockReason,
        note: form.note || undefined,
        ...(isHourly
          ? { date: form.date, startTime: form.startTime, endTime: form.endTime }
          : { startDate: form.startDate, endDate: form.endDate }),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Blok oluşturulamadı.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="mb-5 text-lg font-bold text-gray-900">Blokaj Ekle</h3>

        {isHourly ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Gün</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Başlangıç</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Bitiş</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Başlangıç</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Bitiş</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        )}

        <div className="mb-4 mt-4">
          <label className="mb-2 block text-xs text-gray-500">Neden?</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(REASON_LABELS).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setForm((f) => ({ ...f, reason: val }))}
                className={`rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors ${form.reason === val ? "border-brand-500 bg-brand-50 font-semibold text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          placeholder="Not (opsiyonel)"
          rows={2}
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className="mb-4 w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
        />

        {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" aria-hidden />}
            {loading ? "Kaydediliyor..." : "Blokaj Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewDropdown({
  view,
  onChange,
}: {
  view: CalendarView;
  onChange: (v: CalendarView) => void;
}) {
  const [open, setOpen] = useState(false);
  const labels: Record<CalendarView, string> = { month: "Aylık", week: "Haftalık", day: "Günlük" };
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300"
      >
        {labels[view]}
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[120px] rounded-2xl border border-gray-200 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {(["month", "week", "day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${view === v ? "font-bold text-brand-600" : "text-gray-700"}`}
            >
              {labels[v]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
