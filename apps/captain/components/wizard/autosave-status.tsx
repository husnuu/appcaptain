"use client";

import { cn, FontAwesomeIcon, faCircleCheck, faTriangleExclamation } from "@getyourboat/ui";
import { useEffect, useState } from "react";
import type { AutosaveStatus } from "../../lib/hooks/useAutosaveDraft";

/**
 * Otomatik kayıt geri bildirimi. Kaydederken input altında dönen spinner
 * göstermek yerine, kayıt tamamlanınca sağ üst köşede 2 saniyelik "Kaydedildi"
 * toast'u gösterir. Hata durumunda satır içi uyarı gösterilir.
 */
export function AutosaveStatusIndicator({
  status,
  className,
}: {
  status: AutosaveStatus;
  /** Korunuyor (çağıranlar geçiyor) ama artık kalıcı zaman etiketi gösterilmiyor. */
  lastSavedAt?: string | Date | null;
  className?: string;
}) {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (status !== "saved") return;
    setShowToast(true);
    const timer = setTimeout(() => setShowToast(false), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === "error") {
    return (
      <p className={cn("flex items-center gap-2 text-caption text-danger-600", className)}>
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-[12px]" aria-hidden />
        Kaydedilemedi, tekrar deneniyor…
      </p>
    );
  }

  if (!showToast) return null;

  return (
    <div
      className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-success-200 bg-white px-4 py-2.5 text-body-sm font-medium text-success-700 shadow-md"
      role="status"
      aria-live="polite"
    >
      <FontAwesomeIcon icon={faCircleCheck} className="text-[14px]" aria-hidden />
      Kaydedildi
    </div>
  );
}
