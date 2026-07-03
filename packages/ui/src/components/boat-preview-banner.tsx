"use client";

import { cn } from "../lib/cn";
import { FontAwesomeIcon, faEye } from "../icons";
import { buttonVariants } from "./button";

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
        "sticky top-0 z-40 border-b border-amber-200 bg-amber-50 px-4 py-3",
        className
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2 text-amber-950">
          <FontAwesomeIcon icon={faEye} className="mt-0.5 shrink-0 text-[16px]" aria-hidden />
          <div>
            <p className="text-body-sm font-semibold">Önizleme Modu</p>
            <p className="text-caption text-amber-900/80">
              Bu, ilanınızın müşterilere görüneceği halidir. Değişiklik yapmak için
              &quot;Düzenlemeye Geri Dön&quot;e tıklayın.
              {completionPercent != null
                ? ` İlanınız yaklaşık %${completionPercent} tamamlandı.`
                : null}
            </p>
          </div>
        </div>
        <a
          href={editHref}
          className={buttonVariants({ variant: "secondary", size: "sm", className: "shrink-0 bg-white" })}
        >
          Düzenlemeye Geri Dön
        </a>
      </div>
    </div>
  );
}
