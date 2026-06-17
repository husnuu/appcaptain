"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Modal / Dialog. Desktop: centered, max-width 560px. Mobile: full-width
 * bottom-sheet. Overlay rgba(26,26,46,0.5). Closes on ESC, overlay click, or X.
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(26, 26, 46, 0.5)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "w-full max-w-[560px] bg-white shadow-modal",
          "rounded-t-card sm:rounded-card",
          "max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6">
          {title ? <h2 className="text-subheading text-ink">{title}</h2> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-gray-200 p-4 sm:p-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
