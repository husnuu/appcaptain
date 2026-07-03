"use client";

import * as React from "react";
import type { BoatDetailGalleryImage, BoatDetailViewModel } from "@getyourboat/shared";
import { cn } from "../lib/cn";
import { Badge } from "./badge";
import { Button } from "./button";
import { Modal } from "./modal";
import {
  FontAwesomeIcon,
  faAnchor,
  faCircleCheck,
  faFile,
  faImage,
  faLocationDot,
  faRulerHorizontal,
  faShip,
  faUsers,
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

function Gallery({
  images,
  onSelect,
}: {
  images: BoatDetailGalleryImage[];
  onSelect: (index: number) => void;
}) {
  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-card border border-dashed border-gray-300 bg-gray-50 text-gray-400">
        <FontAwesomeIcon icon={faImage} className="mr-2 text-[20px]" aria-hidden />
        Henüz fotoğraf eklenmedi
      </div>
    );
  }

  const clickable = "cursor-pointer transition hover:opacity-90";

  return (
    <>
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-card md:hidden">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={cn("shrink-0 snap-center", clickable)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt}
              className="h-60 w-full rounded-card object-cover"
            />
          </button>
        ))}
      </div>

      <div className="hidden grid-cols-4 grid-rows-2 gap-2 md:grid md:h-80">
        {images.slice(0, 5).map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "h-full w-full overflow-hidden rounded-lg",
              i === 0 && "col-span-2 row-span-2",
              clickable
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </>
  );
}

function StatStrip({ stats }: { stats: BoatDetailViewModel["stats"] }) {
  if (stats.length === 0) return null;

  const icons = [faUsers, faShip, faCircleCheck, faRulerHorizontal];

  return (
    <div className="flex flex-wrap gap-4 text-body-sm text-gray-600">
      {stats.map((stat, i) => (
        <span key={stat.label} className="inline-flex items-center gap-1.5">
          <FontAwesomeIcon
            icon={icons[i] ?? faCircleCheck}
            className="text-[14px] text-gray-400"
            aria-hidden
          />
          <span className="font-medium text-ink">{stat.value}</span>
        </span>
      ))}
    </div>
  );
}

function LocationSection({
  location,
  showPlaceholder,
}: {
  location: BoatDetailViewModel["location"];
  showPlaceholder: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 text-subheading text-ink">Konum</h2>
      {location?.summary ? (
        <>
          <p className="mb-3 flex items-center gap-1.5 text-body-sm text-gray-700">
            <FontAwesomeIcon icon={faLocationDot} className="text-brand-500" aria-hidden />
            {location.summary}
          </p>
          <div className="flex h-44 items-center justify-center rounded-card border border-dashed border-gray-300 bg-gradient-to-br from-brand-50 to-gray-100 text-gray-400">
            <div className="text-center">
              <FontAwesomeIcon icon={faLocationDot} className="mb-2 text-[24px]" aria-hidden />
              <p className="text-caption">Harita önizlemesi</p>
            </div>
          </div>
        </>
      ) : showPlaceholder ? (
        <PlaceholderText>Henüz konum bilgisi eklenmedi.</PlaceholderText>
      ) : null}
    </section>
  );
}

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

  const typeLine = [model.boatTypeLabel, model.subtitle].filter(Boolean).join(" · ");

  return (
    <div className={cn("space-y-8", className)}>
      <Gallery images={model.gallery} onSelect={setLightboxIndex} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-heading text-ink">{model.title}</h1>
            {typeLine ? (
              <p className="flex flex-wrap items-center gap-2 text-body-sm text-gray-600">
                {model.boatTypeLabel ? (
                  <FontAwesomeIcon icon={faAnchor} className="text-brand-500" aria-hidden />
                ) : null}
                {typeLine}
              </p>
            ) : showPlaceholders ? (
              <PlaceholderText>Tekne tipi ve marka/model henüz eklenmedi.</PlaceholderText>
            ) : null}
            <StatStrip stats={model.stats} />
            {model.stats.length === 0 && showPlaceholders ? (
              <PlaceholderText>Kapasite, kabin ve boyut bilgileri henüz eklenmedi.</PlaceholderText>
            ) : null}
          </div>

          {model.documentBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {model.documentBadges.map((badge) => (
                <Badge key={badge} variant="success">
                  <FontAwesomeIcon icon={faFile} className="text-[12px]" aria-hidden />
                  {badge}
                </Badge>
              ))}
            </div>
          ) : null}

          <section>
            <h2 className="mb-2 text-subheading text-ink">Bu tekne hakkında</h2>
            {model.description ? (
              <p className="whitespace-pre-line text-body-sm text-gray-600">
                {model.description}
              </p>
            ) : showPlaceholders ? (
              <PlaceholderText>Henüz bir açıklama eklenmedi.</PlaceholderText>
            ) : null}
          </section>

          <section>
            <h2 className="mb-3 text-subheading text-ink">Tekne özellikleri</h2>
            {model.specs.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {model.specs.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <p className="text-caption text-gray-500">{item.label}</p>
                    <p className="text-body-sm font-medium text-ink">{item.value}</p>
                  </li>
                ))}
              </ul>
            ) : showPlaceholders ? (
              <PlaceholderText>Henüz teknik özellik eklenmedi.</PlaceholderText>
            ) : null}
          </section>

          <section>
            <h2 className="mb-3 text-subheading text-ink">Sunulan donanımlar</h2>
            {model.amenities.length > 0 ? (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {model.amenities.map((a) => (
                  <li key={a.label} className="flex items-center gap-2 text-body-sm text-gray-700">
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="text-[14px] text-success-500"
                      aria-hidden
                    />
                    <span>{a.label}</span>
                    {a.isExtra && a.extraPrice != null ? (
                      <Badge variant="warning">
                        +{formatPrice(a.extraPrice, a.currency ?? "TRY")}
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : showPlaceholders ? (
              <PlaceholderText>Henüz donanım seçilmedi.</PlaceholderText>
            ) : null}
          </section>

          <LocationSection location={model.location} showPlaceholder={showPlaceholders} />

          <section>
            <h2 className="mb-2 text-subheading text-ink">Tekne kuralları ve politikalar</h2>
            {model.rules ? (
              <p className="mb-4 whitespace-pre-line text-body-sm text-gray-600">{model.rules}</p>
            ) : null}
            {model.policyLines.length > 0 ? (
              <ul className="space-y-2">
                {model.policyLines.map((line) => (
                  <li
                    key={line.label}
                    className="flex flex-wrap justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-body-sm"
                  >
                    <span className="text-gray-600">{line.label}</span>
                    <span className="font-medium text-ink">{line.value}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {!model.rules && model.policyLines.length === 0 && showPlaceholders ? (
              <PlaceholderText>Henüz kural veya politika eklenmedi.</PlaceholderText>
            ) : null}
          </section>

          {model.boatPlanUrl ? (
            <section>
              <h2 className="mb-2 text-subheading text-ink">Tekne planı</h2>
              <a
                href={model.boatPlanUrl}
                target="_blank"
                rel="noreferrer"
                className="text-body-sm font-medium text-brand-600 hover:underline"
              >
                Planı görüntüle
              </a>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-card border border-gray-300 bg-white p-5 shadow-card">
            <h2 className="text-subheading text-ink">Fiyatlandırma</h2>
            {model.pricing.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {model.pricing.map((p) => (
                  <li key={p.label}>
                    <p className="text-caption text-gray-500">{p.label}</p>
                    <p className="text-[22px] font-bold text-ink">
                      {formatPrice(p.price, p.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : showPlaceholders ? (
              <p className="mt-3 text-body-sm italic text-gray-400">Henüz fiyat girilmedi.</p>
            ) : (
              <p className="mt-3 text-body-sm text-gray-400">Fiyat bilgisi girilmedi.</p>
            )}

            <div className="mt-4 space-y-2">
              {model.depositLabel ? (
                <p className="text-body-sm text-gray-600">
                  <span className="font-medium text-ink">Depozito:</span> {model.depositLabel}
                </p>
              ) : null}
              {model.cancellationLabel ? (
                <Badge variant="neutral">{model.cancellationLabel}</Badge>
              ) : null}
              {model.approvalLabel ? (
                <Badge variant="model">{model.approvalLabel}</Badge>
              ) : null}
            </div>

            {model.contactForFuelCost ? (
              <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-body-sm text-brand-800">
                Yakıt maliyeti için lütfen bizimle iletişime geçin.
              </p>
            ) : model.fuelCostNote ? (
              <p className="mt-3 text-body-sm text-gray-600">
                <span className="font-medium text-ink">Yakıt:</span> {model.fuelCostNote}
              </p>
            ) : null}

            <Button className="mt-4 w-full" disabled={bookingDisabled}>
              {bookingLabel}
            </Button>
            {bookingDisabled ? (
              <p className="mt-2 text-center text-caption text-gray-400">
                Önizleme modunda rezervasyon yapılamaz
              </p>
            ) : null}

            <p className="mt-3 flex items-center gap-1.5 text-caption text-gray-400">
              <FontAwesomeIcon icon={faLocationDot} className="text-[12px]" aria-hidden />
              {model.location?.summary ?? "Konum bilgisi henüz girilmedi."}
            </p>
          </div>
        </aside>
      </div>

      <Modal
        open={lightboxIndex != null}
        onClose={() => setLightboxIndex(null)}
        title={activeImage?.alt}
        className="max-w-[min(960px,95vw)]"
      >
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeImage.url}
            alt={activeImage.alt}
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        ) : null}
      </Modal>
    </div>
  );
}
