"use client";

import * as React from "react";
import type {
  BoatDetailAmenity,
  BoatDetailGalleryImage,
  BoatDetailPolicyLine,
  BoatDetailViewModel,
} from "@getyourboat/shared";
import { cn } from "../lib/cn";
import { Modal } from "./modal";
import {
  FontAwesomeIcon,
  faAnchor,
  faArrowLeft,
  faArrowRight,
  faArrowRightFromBracket,
  faBolt,
  faCalendarDays,
  faCheck,
  faCircleCheck,
  faCircleInfo,
  faClock,
  faFile,
  faGaugeHigh,
  faImage,
  faLayerGroup,
  faLocationDot,
  faRightToBracket,
  faRulerHorizontal,
  faShieldHalved,
  faShip,
  faSun,
  faTriangleExclamation,
  faUsers,
  type IconDefinition,
} from "../icons";

export interface BoatDetailViewProps {
  model: BoatDetailViewModel;
  /** Disable the booking CTA (true for captain preview, false on real web). */
  bookingDisabled?: boolean;
  bookingLabel?: string;
  /** Show placeholder text for empty sections (draft preview). */
  showPlaceholders?: boolean;
  className?: string;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function PlaceholderText({ children }: { children: React.ReactNode }) {
  return <p className="text-body-sm italic text-gray-400">{children}</p>;
}

function SectionDivider() {
  return <hr className="border-gray-100" />;
}

/* ------------------------------- Gallery ------------------------------- */

function Gallery({
  images,
  onSelect,
}: {
  images: BoatDetailGalleryImage[];
  onSelect: (index: number) => void;
}) {
  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 text-gray-400">
        <FontAwesomeIcon icon={faImage} className="mr-2 text-[20px]" aria-hidden />
        Henüz fotoğraf eklenmedi
      </div>
    );
  }

  const clickable = "cursor-pointer transition-transform duration-300 hover:scale-105";
  const cover = images[0];
  const right = images.slice(1, 5);
  if (!cover) return null;

  return (
    <div className="relative">
      {/* Mobile: swipeable strip */}
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-3xl md:hidden">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className="shrink-0 snap-center overflow-hidden rounded-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt} className="h-60 w-[85vw] object-cover" />
          </button>
        ))}
      </div>

      {/* Desktop: Airbnb mosaic — 1 big left + 2x2 right */}
      <div className="hidden h-[420px] grid-cols-2 gap-2 overflow-hidden rounded-3xl md:grid lg:h-[480px]">
        <button
          type="button"
          onClick={() => onSelect(0)}
          className={cn("relative h-full w-full overflow-hidden", clickable)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.url} alt={cover.alt} className="h-full w-full object-cover" />
        </button>
        <div className="grid grid-cols-2 grid-rows-2 gap-2">
          {right.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i + 1)}
              className={cn("relative h-full w-full overflow-hidden", clickable)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
            </button>
          ))}
          {/* Fill empty mosaic slots so the grid keeps its shape */}
          {Array.from({ length: Math.max(0, 4 - right.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="h-full w-full bg-gray-100" />
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <button
          type="button"
          onClick={() => onSelect(0)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 text-body-sm font-semibold text-gray-800 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
        >
          <FontAwesomeIcon icon={faLayerGroup} className="text-[13px]" aria-hidden />
          Tüm fotoğraflar ({images.length})
        </button>
      )}
    </div>
  );
}

/* ------------------------------- Stat chips ------------------------------- */

function StatChips({ stats }: { stats: BoatDetailViewModel["stats"] }) {
  if (stats.length === 0) return null;
  const icons = [faUsers, faShip, faCircleCheck, faRulerHorizontal];

  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5"
        >
          <FontAwesomeIcon
            icon={icons[i] ?? faCircleCheck}
            className="text-[16px] text-brand-600"
            aria-hidden
          />
          <div>
            <p className="text-body-sm font-semibold text-ink">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- Amenities ------------------------------- */

function AmenityRow({ amenity }: { amenity: BoatDetailAmenity }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50">
        <FontAwesomeIcon icon={faCheck} className="text-[10px] text-brand-600" aria-hidden />
      </span>
      <span className="text-body-sm text-gray-700">{amenity.label}</span>
      {amenity.isExtra && amenity.extraPrice != null ? (
        <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-caption font-semibold text-amber-600">
          +{formatPrice(amenity.extraPrice, amenity.currency ?? "TRY")}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------- Policies ------------------------------- */

const CHECK_IN_LABELS = new Set(["Giriş Saati", "Giriş Saati (günlük kiralama)"]);
const CHECK_OUT_LABELS = new Set(["Çıkış Saati", "Çıkış Saati (günlük kiralama)"]);

function policyIcon(label: string): IconDefinition {
  if (label.includes("Minimum")) return faCalendarDays;
  if (label.includes("Teslim") || label.includes("Gün")) return faClock;
  if (label.includes("Klima")) return faBolt;
  if (label.includes("Liman")) return faAnchor;
  if (label.includes("Temizlik")) return faSun;
  if (label.includes("Yakıt")) return faGaugeHigh;
  if (label.includes("Geçiş")) return faFile;
  return faCircleInfo;
}

function CheckTimeCard({
  icon,
  label,
  value,
}: {
  icon: IconDefinition;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
      <div className="mb-2 flex items-center gap-2 text-caption uppercase tracking-wide text-gray-500">
        <FontAwesomeIcon icon={icon} className="text-[14px] text-brand-600" aria-hidden />
        {label}
      </div>
      <p className="text-[22px] font-bold text-ink">{value}</p>
    </div>
  );
}

function PolicyRow({ line }: { line: BoatDetailPolicyLine }) {
  const included = line.value === "Fiyata dahil";
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <div className="flex items-center gap-3 text-gray-600">
        <FontAwesomeIcon icon={policyIcon(line.label)} className="text-[15px] text-gray-400" aria-hidden />
        <span className="text-body-sm">{line.label}</span>
      </div>
      <span
        className={cn(
          "text-body-sm font-semibold",
          included ? "text-success-600" : "text-ink"
        )}
      >
        {line.value}
      </span>
    </div>
  );
}

/* ------------------------------- Location ------------------------------- */

function LocationSection({
  location,
  showPlaceholder,
}: {
  location: BoatDetailViewModel["location"];
  showPlaceholder: boolean;
}) {
  if (!location?.summary) {
    return showPlaceholder ? (
      <PlaceholderText>Henüz konum bilgisi eklenmedi.</PlaceholderText>
    ) : null;
  }
  return (
    <>
      <p className="mb-4 flex items-center gap-2 text-body-sm text-gray-600">
        <FontAwesomeIcon icon={faLocationDot} className="text-brand-600" aria-hidden />
        {location.summary}
      </p>
      <div className="flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-50 to-gray-100 text-gray-400">
        <div className="text-center">
          <FontAwesomeIcon icon={faLocationDot} className="mb-2 text-[26px] text-brand-500" aria-hidden />
          <p className="text-caption">
            {location.latitude != null && location.longitude != null
              ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
              : "Harita önizlemesi"}
          </p>
        </div>
      </div>
    </>
  );
}

/* ------------------------------- Section shell ------------------------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-[22px] font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

/* ------------------------------- Booking card ------------------------------- */

function badgeTone(kind: "cancellation" | "approval", label: string) {
  if (kind === "cancellation") {
    return label.includes("Esnek")
      ? "bg-success-50 text-success-700 border-success-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  }
  return label.includes("Anında") || label.includes("Anlık")
    ? "bg-brand-50 text-brand-700 border-brand-200"
    : "bg-gray-50 text-gray-600 border-gray-200";
}

function BookingCard({
  model,
  bookingDisabled,
  bookingLabel,
  showPlaceholders,
}: {
  model: BoatDetailViewModel;
  bookingDisabled: boolean;
  bookingLabel: string;
  showPlaceholders: boolean;
}) {
  const primary = model.pricing[0] ?? null;
  const secondary = model.pricing.slice(1);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
      {primary ? (
        <div className="mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-[30px] font-bold text-ink">
              {formatPrice(primary.price, primary.currency)}
            </span>
            <span className="text-body-sm text-gray-400">{primary.label}</span>
          </div>
          {secondary.map((p) => (
            <p key={p.label} className="mt-0.5 text-body-sm text-gray-500">
              {p.label}: {formatPrice(p.price, p.currency)}
            </p>
          ))}
        </div>
      ) : showPlaceholders ? (
        <p className="mb-5 text-body-sm italic text-gray-400">Henüz fiyat girilmedi.</p>
      ) : (
        <p className="mb-5 text-body-sm text-gray-400">Fiyat bilgisi girilmedi.</p>
      )}

      {model.depositLabel ? (
        <div className="mb-4 flex items-center justify-between text-body-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <FontAwesomeIcon icon={faShieldHalved} className="text-[13px] text-gray-400" aria-hidden />
            Depozito
          </span>
          <span className="font-semibold text-ink">{model.depositLabel}</span>
        </div>
      ) : null}

      {(model.cancellationLabel || model.approvalLabel) && (
        <div className="mb-5 flex gap-2">
          {model.cancellationLabel ? (
            <span
              className={cn(
                "flex-1 rounded-xl border py-2 text-center text-caption font-semibold",
                badgeTone("cancellation", model.cancellationLabel)
              )}
            >
              {model.cancellationLabel}
            </span>
          ) : null}
          {model.approvalLabel ? (
            <span
              className={cn(
                "flex-1 rounded-xl border py-2 text-center text-caption font-semibold",
                badgeTone("approval", model.approvalLabel)
              )}
            >
              {model.approvalLabel}
            </span>
          ) : null}
        </div>
      )}

      {model.contactForFuelCost ? (
        <div className="mb-5 flex items-start gap-2 rounded-xl bg-brand-50 p-3">
          <FontAwesomeIcon icon={faGaugeHigh} className="mt-0.5 shrink-0 text-brand-600" aria-hidden />
          <p className="text-caption leading-relaxed text-brand-800">
            Yakıt maliyeti dahil değil. Detaylar için lütfen iletişime geçin.
          </p>
        </div>
      ) : model.fuelCostNote ? (
        <p className="mb-5 text-body-sm text-gray-600">
          <span className="font-medium text-ink">Yakıt:</span> {model.fuelCostNote}
        </p>
      ) : null}

      <button
        type="button"
        disabled={bookingDisabled}
        className={cn(
          "w-full rounded-2xl py-3.5 text-body-sm font-bold transition-all",
          bookingDisabled
            ? "cursor-not-allowed bg-gray-200 text-gray-400"
            : "bg-brand-600 text-white shadow-md hover:bg-brand-700 hover:shadow-lg"
        )}
      >
        {bookingDisabled ? "Önizleme modunda rezervasyon yapılamaz" : bookingLabel}
      </button>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-caption text-gray-400">
        <FontAwesomeIcon icon={faLocationDot} className="text-[12px]" aria-hidden />
        {model.location?.summary ?? "Konum bilgisi henüz girilmedi."}
      </p>
    </div>
  );
}

/* =============================== Main view =============================== */

/**
 * Customer-facing boat detail page. Single source of truth for how a listing
 * renders publicly — used by apps/web and simulated in the captain preview.
 */
export function BoatDetailView({
  model,
  bookingDisabled = false,
  bookingLabel = "Rezervasyon Yap",
  showPlaceholders = false,
  className,
}: BoatDetailViewProps) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const activeImage = lightboxIndex != null ? model.gallery[lightboxIndex] : null;

  const showLightbox = (next: number) => {
    const total = model.gallery.length;
    if (total === 0) return;
    setLightboxIndex(((next % total) + total) % total);
  };

  const typeLine = [model.boatTypeLabel, model.subtitle].filter(Boolean).join(" · ");

  const checkIn = model.policyLines.find((l) => CHECK_IN_LABELS.has(l.label));
  const checkOut = model.policyLines.find((l) => CHECK_OUT_LABELS.has(l.label));
  const otherPolicyLines = model.policyLines.filter(
    (l) => !CHECK_IN_LABELS.has(l.label) && !CHECK_OUT_LABELS.has(l.label)
  );

  return (
    <div className={cn("space-y-8", className)}>
      <Gallery images={model.gallery} onSelect={setLightboxIndex} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {/* Title + type + stat chips */}
          <div className="space-y-4">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-ink sm:text-[32px]">
                {model.title}
              </h1>
              {typeLine ? (
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-body-sm text-gray-500">
                  {model.boatTypeLabel ? (
                    <span className="font-medium text-gray-700">{model.boatTypeLabel}</span>
                  ) : null}
                  {model.subtitle ? (
                    <>
                      {model.boatTypeLabel ? <span aria-hidden>·</span> : null}
                      <span>{model.subtitle}</span>
                    </>
                  ) : null}
                </p>
              ) : showPlaceholders ? (
                <PlaceholderText>Tekne tipi ve marka/model henüz eklenmedi.</PlaceholderText>
              ) : null}
            </div>

            <StatChips stats={model.stats} />
            {model.stats.length === 0 && showPlaceholders ? (
              <PlaceholderText>Kapasite, kabin ve boyut bilgileri henüz eklenmedi.</PlaceholderText>
            ) : null}
          </div>

          {/* Certificates */}
          {model.documentBadges.length > 0 ? (
            <>
              <SectionDivider />
              <div>
                <h3 className="mb-3 text-caption font-semibold uppercase tracking-wide text-gray-700">
                  Belgeler
                </h3>
                <div className="flex flex-wrap gap-2">
                  {model.documentBadges.map((badge) => (
                    <span
                      key={badge}
                      className="flex items-center gap-1.5 rounded-full border border-success-200 bg-success-50 px-3 py-1.5 text-caption font-semibold text-success-700"
                    >
                      <FontAwesomeIcon icon={faShieldHalved} className="text-[12px]" aria-hidden />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <SectionDivider />

          {/* About */}
          <Section title="Bu tekne hakkında">
            {model.description ? (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-600">
                {model.description}
              </p>
            ) : showPlaceholders ? (
              <PlaceholderText>Henüz bir açıklama eklenmedi.</PlaceholderText>
            ) : null}
          </Section>

          <SectionDivider />

          {/* Specs */}
          <Section title="Tekne özellikleri">
            {model.specs.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {model.specs.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <p className="mb-1 text-caption text-gray-400">{item.label}</p>
                    <p className="text-base font-bold text-ink">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : showPlaceholders ? (
              <PlaceholderText>Henüz teknik özellik eklenmedi.</PlaceholderText>
            ) : null}
          </Section>

          {/* Amenities */}
          {(model.amenities.length > 0 || showPlaceholders) && (
            <>
              <SectionDivider />
              <Section title="Sunulan donanımlar">
                {model.amenities.length > 0 ? (
                  <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    {model.amenities.map((a) => (
                      <AmenityRow key={a.label} amenity={a} />
                    ))}
                  </div>
                ) : (
                  <PlaceholderText>Henüz donanım seçilmedi.</PlaceholderText>
                )}
              </Section>
            </>
          )}

          {/* Location */}
          {(model.location?.summary || showPlaceholders) && (
            <>
              <SectionDivider />
              <Section title="Konum">
                <LocationSection location={model.location} showPlaceholder={showPlaceholders} />
              </Section>
            </>
          )}

          {/* Rules & policies */}
          {(model.rules ||
            model.policyLines.length > 0 ||
            showPlaceholders) && (
            <>
              <SectionDivider />
              <Section title="Kurallar ve politikalar">
                {checkIn || checkOut ? (
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    {checkIn ? (
                      <CheckTimeCard icon={faRightToBracket} label="Giriş Saati" value={checkIn.value} />
                    ) : null}
                    {checkOut ? (
                      <CheckTimeCard
                        icon={faArrowRightFromBracket}
                        label="Çıkış Saati"
                        value={checkOut.value}
                      />
                    ) : null}
                  </div>
                ) : null}

                {otherPolicyLines.length > 0 ? (
                  <div>
                    {otherPolicyLines.map((line) => (
                      <PolicyRow key={line.label} line={line} />
                    ))}
                  </div>
                ) : null}

                {model.rules ? (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <FontAwesomeIcon
                      icon={faTriangleExclamation}
                      className="mt-0.5 shrink-0 text-amber-500"
                      aria-hidden
                    />
                    <p className="whitespace-pre-line text-body-sm leading-relaxed text-amber-800">
                      {model.rules}
                    </p>
                  </div>
                ) : null}

                {!model.rules &&
                model.policyLines.length === 0 &&
                showPlaceholders ? (
                  <PlaceholderText>Henüz kural veya politika eklenmedi.</PlaceholderText>
                ) : null}
              </Section>
            </>
          )}

          {/* Boat plan */}
          {model.boatPlanUrl ? (
            <>
              <SectionDivider />
              <Section title="Tekne planı">
                <a
                  href={model.boatPlanUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-body-sm font-medium text-brand-600 hover:underline"
                >
                  <FontAwesomeIcon icon={faFile} className="text-[13px]" aria-hidden />
                  Planı görüntüle
                </a>
              </Section>
            </>
          ) : null}
        </div>

        {/* Sticky booking card */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <BookingCard
              model={model}
              bookingDisabled={bookingDisabled}
              bookingLabel={bookingLabel}
              showPlaceholders={showPlaceholders}
            />
          </div>
        </aside>
      </div>

      {/* Lightbox */}
      <Modal
        open={lightboxIndex != null}
        onClose={() => setLightboxIndex(null)}
        title={activeImage?.alt}
        className="max-w-[min(960px,95vw)]"
      >
        {activeImage ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.url}
              alt={activeImage.alt}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
            {model.gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Önceki"
                  onClick={() => showLightbox((lightboxIndex ?? 0) - 1)}
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md hover:bg-white"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-[14px]" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Sonraki"
                  onClick={() => showLightbox((lightboxIndex ?? 0) + 1)}
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md hover:bg-white"
                >
                  <FontAwesomeIcon icon={faArrowRight} className="text-[14px]" aria-hidden />
                </button>
                <div className="mt-3 text-center text-caption text-gray-500">
                  {(lightboxIndex ?? 0) + 1} / {model.gallery.length}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
