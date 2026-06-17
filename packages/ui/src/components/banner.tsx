"use client";

import * as React from "react";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

export interface BannerProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  onDismiss?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/** Dismissible info/tip banner: icon + title + description. */
export function Banner({
  icon: Icon,
  title,
  description,
  onDismiss,
  className,
  children,
}: BannerProps) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-card border border-brand-100 bg-brand-50 p-4",
        className
      )}
    >
      {Icon ? (
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
      ) : null}
      <div className="flex-1">
        <h3 className="text-body-sm font-semibold text-ink">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-body-sm text-gray-600">{description}</p>
        ) : null}
        {children}
      </div>
      {onDismiss ? (
        <button
          type="button"
          aria-label="Kapat"
          onClick={onDismiss}
          className="rounded p-1 text-gray-400 transition hover:bg-white/60 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export interface CarouselProps {
  slides: React.ReactNode[];
  className?: string;
}

/** Minimal slide carousel with dot pagination (3-item announcement style). */
export function Carousel({ slides, className }: CarouselProps) {
  const [index, setIndex] = React.useState(0);
  const count = slides.length;
  if (count === 0) return null;
  const active = Math.min(index, count - 1);

  return (
    <div className={className}>
      <div>{slides[active]}</div>
      {count > 1 ? (
        <div className="mt-2 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slayt ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-pill transition-all",
                i === active ? "w-4 bg-brand-500" : "w-1.5 bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
