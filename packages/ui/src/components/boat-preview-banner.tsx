"use client";

import { cn } from "../lib/cn";
import { FontAwesomeIcon, faEye, faPenToSquare } from "../icons";

export interface BoatPreviewBannerProps {
  editHref: string;
  completionPercent?: number;
  className?: string;
}

/** Sticky banner shown on captain listing preview routes. */
export function BoatPreviewBanner({
  editHref,
  completionPercent,
  className,
}: BoatPreviewBannerProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-40 border-b border-amber-200 bg-amber-50",
        className
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <FontAwesomeIcon icon={faEye} className="text-[15px] text-amber-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-amber-800">Önizleme Modu</p>
            <p className="text-caption text-amber-700">
              Müşteriler ilanınızı bu şekilde görecek
              {completionPercent != null ? ` · %${completionPercent} tamamlandı` : null}
            </p>
          </div>
        </div>
        <a
          href={editHref}
          className="flex shrink-0 items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-caption font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <FontAwesomeIcon icon={faPenToSquare} className="text-[12px]" aria-hidden />
          Düzenlemeye Geri Dön
        </a>
      </div>
    </div>
  );
}
