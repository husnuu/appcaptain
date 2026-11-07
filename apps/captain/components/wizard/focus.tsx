"use client";

/**
 * Tekne ve deneyim sihirbazlarının ortak "odak" görünümü: tam ekran düzen, üstte
 * logo + adım menüsü + aksiyonlar, altta ilerleme çizgili sabit gezinme çubuğu.
 * Yalnızca sunum katmanıdır; alanlar, sıra ve kaydetme mantığı adımlarda kalır.
 */

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AhoyLogo,
  cn,
  FontAwesomeIcon,
  faArrowLeft,
  faCheck,
  faChevronDown,
  faCloudArrowUp,
  faLock,
  faSpinner,
  type IconDefinition,
} from "@getyourboat/ui";

/* ------------------------------------------------------------------ */
/* Bağlam                                                              */
/* ------------------------------------------------------------------ */

interface WizardChrome {
  /** Alt çubuktaki ilerleme çizgisi (0–100). */
  progress: number;
  /** Önceki adıma dönüş; ilk adımda tanımsız bırakılır. */
  onBack?: () => void;
}

const WizardChromeContext = createContext<WizardChrome>({ progress: 0 });

export const WizardChromeProvider = WizardChromeContext.Provider;
export const useWizardChrome = () => useContext(WizardChromeContext);

/* ------------------------------------------------------------------ */
/* Üst çubuk                                                           */
/* ------------------------------------------------------------------ */

export interface FocusStep {
  id: string;
  label: string;
  done: boolean;
  reachable: boolean;
  lockedHint?: string;
}

export function FocusTopBar({
  steps,
  currentId,
  onSelect,
  actions,
}: {
  steps: FocusStep[];
  currentId: string;
  onSelect: (id: string) => void;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-3 px-4 sm:h-[76px] sm:px-8">
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-80"
          aria-label="Kaptan paneli ana sayfası"
        >
          <span className="sm:hidden">
            <AhoyLogo size={22} />
          </span>
          <span className="hidden sm:inline-flex">
            <AhoyLogo size={27} />
          </span>
        </Link>
        <div className="flex min-w-0 flex-1 justify-center">
          <StepMenu steps={steps} currentId={currentId} onSelect={onSelect} />
        </div>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}

/** Üst çubuktaki aksiyon düğmesi (Kaydet ve çık, Önizle …). */
export function TopBarButton({
  children,
  onClick,
  icon,
  className,
  title,
  variant = "outline",
}: {
  children?: ReactNode;
  onClick: () => void;
  icon?: IconDefinition;
  className?: string;
  title?: string;
  variant?: "outline" | "ghost" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        variant === "outline" && "border border-gray-300 bg-white text-ink hover:border-ink",
        variant === "ghost" && "text-gray-600 hover:bg-gray-100 hover:text-ink",
        variant === "primary" && "bg-brand-500 text-white hover:bg-brand-600",
        className
      )}
    >
      {icon ? <FontAwesomeIcon icon={icon} className="text-[13px]" aria-hidden /> : null}
      {children}
    </button>
  );
}

function StepMenu({
  steps,
  currentId,
  onSelect,
}: {
  steps: FocusStep[];
  currentId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const index = Math.max(0, steps.findIndex((s) => s.id === currentId));
  const current = steps[index];

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-w-0 max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink transition hover:border-gray-300 hover:bg-gray-50 sm:px-4"
      >
        <span className="shrink-0 tabular-nums text-gray-400">
          {index + 1}/{steps.length}
        </span>
        <span className="truncate">{current?.label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={cn("shrink-0 text-[11px] text-gray-400 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-[288px] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-modal"
        >
          {steps.map((s, i) => {
            const active = s.id === currentId;
            return (
              <button
                key={s.id}
                type="button"
                role="menuitem"
                disabled={!s.reachable}
                title={!s.reachable ? s.lockedHint : undefined}
                onClick={() => {
                  if (!s.reachable) return;
                  onSelect(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition",
                  active
                    ? "bg-brand-50 font-semibold text-brand-600"
                    : s.reachable
                      ? "text-ink hover:bg-gray-50"
                      : "cursor-not-allowed text-gray-300"
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    active
                      ? "bg-brand-500 text-white"
                      : s.done
                        ? "bg-green-50 text-green-600"
                        : s.reachable
                          ? "border border-gray-200 text-gray-500"
                          : "border border-gray-100 text-gray-300"
                  )}
                >
                  {s.done && !active ? (
                    <FontAwesomeIcon icon={faCheck} className="text-[10px]" aria-hidden />
                  ) : !s.reachable ? (
                    <FontAwesomeIcon icon={faLock} className="text-[9px]" aria-hidden />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Başlık ve alt çubuk                                                 */
/* ------------------------------------------------------------------ */

export function WizardHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-9 sm:mb-10">
      <h1 className="text-[30px] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[38px]">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-[640px] text-[16px] leading-relaxed text-gray-500 sm:text-[17px]">
          {description}
        </p>
      ) : null}
    </header>
  );
}

/** Ekranın altına sabitlenen gezinme çubuğu; üst kenarında ilerleme çizgisi. */
export function WizardFooterBar({ children }: { children: ReactNode }) {
  const { progress } = useWizardChrome();
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 shadow-[0_-8px_24px_-18px_rgba(34,40,48,0.35)] backdrop-blur">
      <div
        className="h-1 w-full bg-gray-100"
        role="progressbar"
        aria-label="İlerleme"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-r-full bg-brand-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-[80px] sm:px-8">
        {children}
      </div>
    </div>
  );
}

export function WizardBackButton({ onClick, label = "Geri dön" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-ml-2 inline-flex h-11 items-center gap-2 rounded-xl px-3 text-[15px] font-semibold text-ink underline-offset-4 transition hover:bg-gray-100 hover:underline"
    >
      <FontAwesomeIcon icon={faArrowLeft} className="text-[13px]" aria-hidden />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Seçim kartları                                                      */
/* ------------------------------------------------------------------ */

/** Seçilebilir kartların ortak görünümü (tekne tipi, donanım, kategori …). */
export function tileClass(on: boolean, error?: boolean) {
  return cn(
    "relative rounded-2xl border-2 bg-white text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
    on
      ? "border-brand-500 bg-brand-50/70 text-brand-600"
      : error
        ? "border-danger-400 text-ink hover:border-danger-500"
        : "border-gray-200 text-ink hover:border-gray-400"
  );
}

export function TileCheck({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span
      className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white"
      aria-hidden
    >
      <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
    </span>
  );
}

export interface ChoiceOption<V extends string> {
  value: V;
  label: string;
  description?: string;
  icon?: IconDefinition;
}

/** Tek seçimli kart ızgarası (select yerine). */
export function ChoiceTiles<V extends string>({
  options,
  value,
  onChange,
  columns = 3,
  ariaLabel,
  error,
}: {
  options: ChoiceOption<V>[];
  value: V | "";
  onChange: (value: V) => void;
  columns?: 2 | 3;
  ariaLabel?: string;
  error?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "grid gap-3",
        columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              tileClass(on, error),
              "flex min-h-[68px] flex-col justify-center gap-1 py-3.5 pl-4 pr-9"
            )}
          >
            {o.icon ? (
              <FontAwesomeIcon
                icon={o.icon}
                className={cn("mb-1 text-[18px]", on ? "text-brand-500" : "text-gray-400")}
                aria-hidden
              />
            ) : null}
            <span className="text-[15px] font-bold leading-snug">{o.label}</span>
            {o.description ? (
              <span className="text-[13px] font-normal leading-snug text-gray-500">{o.description}</span>
            ) : null}
            <TileCheck on={on} />
          </button>
        );
      })}
    </div>
  );
}

/** Çok seçimli kart (ikincil kategori, erişilebilirlik …). */
export function ToggleTile({
  on,
  onToggle,
  label,
  className,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onToggle}
      className={cn(tileClass(on), "flex min-h-[60px] items-center py-3 pl-4 pr-9", className)}
    >
      <span className="text-[14.5px] font-semibold leading-snug">{label}</span>
      <TileCheck on={on} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Alt sekmeler (Özellikler adımı)                                      */
/* ------------------------------------------------------------------ */

export interface SubStepItem {
  id: string;
  label: string;
  disabled?: boolean;
  lockedHint?: string;
  badge?: ReactNode;
}

export function SubStepTabs({
  items,
  activeId,
  onChange,
  onLockedClick,
}: {
  items: SubStepItem[];
  activeId: string;
  onChange: (id: string) => void;
  onLockedClick?: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex gap-1 overflow-x-auto rounded-2xl bg-gray-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((t, i) => {
        const active = t.id === activeId;
        const locked = !!t.disabled;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-disabled={locked}
            title={locked ? t.lockedHint : undefined}
            onClick={() => (locked ? onLockedClick?.(t.id) : onChange(t.id))}
            className={cn(
              "flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition",
              active
                ? "bg-white text-ink shadow-sm"
                : locked
                  ? "cursor-not-allowed text-gray-400"
                  : "text-gray-500 hover:text-ink"
            )}
          >
            <span
              className={cn(
                "grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold",
                active ? "bg-brand-500 text-white" : "bg-white text-gray-500"
              )}
            >
              {i + 1}
            </span>
            {t.label}
            {t.badge}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sayaç satırı                                                        */
/* ------------------------------------------------------------------ */

/** "Etiket solda, +/- sağda" satırı; üst öğede `divide-y` ile ayrılır. */
export function CounterRow({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[16px] font-medium leading-snug text-ink">
            {label}
            {required ? (
              <span className="ml-0.5 text-danger-500" aria-hidden>
                *
              </span>
            ) : null}
          </p>
          {hint ? <p className="mt-0.5 text-[13px] text-gray-500">{hint}</p> : null}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
      {error ? <p className="mt-2 text-caption text-danger-600">{error}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bölüm başlığı                                                       */
/* ------------------------------------------------------------------ */

export function SectionTitle({
  children,
  hint,
  optional,
}: {
  children: ReactNode;
  hint?: ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-[19px] font-bold tracking-[-0.01em] text-ink">
        {children}
        {optional ? <span className="ml-1.5 text-[15px] font-medium text-gray-400">(opsiyonel)</span> : null}
      </h2>
      {hint ? <p className="mt-1 text-[14px] leading-relaxed text-gray-500">{hint}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dosya yükleme alanı                                                 */
/* ------------------------------------------------------------------ */

export function UploadDropzone({
  onFiles,
  accept,
  multiple,
  disabled,
  busy,
  title,
  hint,
  buttonLabel = "Dosya seç",
  compact,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  busy?: boolean;
  title: string;
  hint?: string;
  buttonLabel?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const blocked = disabled || busy;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!blocked) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (blocked) return;
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors",
        compact ? "py-6" : "py-10",
        drag ? "border-brand-500 bg-brand-50/60" : "border-gray-300 bg-gray-50/70",
        blocked && "opacity-70"
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-500 shadow-sm">
        <FontAwesomeIcon icon={busy ? faSpinner : faCloudArrowUp} spin={busy} className="text-[18px]" aria-hidden />
      </span>
      <p className="mt-3 text-[15.5px] font-semibold text-ink">{busy ? "Yükleniyor…" : title}</p>
      {hint ? <p className="mt-1 max-w-[420px] text-[13.5px] leading-relaxed text-gray-500">{hint}</p> : null}
      <button
        type="button"
        disabled={blocked}
        onClick={() => inputRef.current?.click()}
        className="mt-4 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-semibold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:hover:border-gray-300"
      >
        {buttonLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={blocked}
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </div>
  );
}
