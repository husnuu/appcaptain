"use client";

import {
  cn,
  FontAwesomeIcon,
  faCircleCheck,
  faSpinner,
  faTriangleExclamation,
} from "@getyourboat/ui";
import { useEffect, useState } from "react";
import type { AutosaveStatus } from "../../lib/hooks/useAutosaveDraft";

/**
 * Otomatik kayıt geri bildirimi. Sihirbazın üst çubuğunda satır içi gösterilir:
 * kaydederken sessiz bir "Kaydediliyor…", tamamlanınca 2 saniyelik "Kaydedildi".
 * Hata durumunda kalıcı uyarı gösterilir.
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
      <p className={cn("flex items-center gap-2 text-[13px] font-medium text-danger-600", className)}>
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-[12px]" aria-hidden />
        Kaydedilemedi, tekrar deneniyor…
      </p>
    );
  }

  if (status === "saving") {
    return (
      <p className={cn("flex items-center gap-1.5 text-[13px] font-medium text-gray-400", className)}>
        <FontAwesomeIcon icon={faSpinner} spin className="text-[12px]" aria-hidden />
        Kaydediliyor…
      </p>
    );
  }

  if (!showToast) return null;

  return (
    <p
      className={cn("flex items-center gap-1.5 text-[13px] font-semibold text-success-600", className)}
      role="status"
      aria-live="polite"
    >
      <FontAwesomeIcon icon={faCircleCheck} className="text-[13px]" aria-hidden />
      Kaydedildi
    </p>
  );
}
