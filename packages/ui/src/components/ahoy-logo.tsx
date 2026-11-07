import { cn } from "../lib/cn";

export interface AhoyLogoProps {
  /** "ahoy" kelimesinin piksel boyutu; "boats" orantılı küçülür. */
  size?: number;
  /** Koyu zemin için "light". */
  tone?: "brand" | "light";
  /** Logonun yanındaki küçük etiket (ör. "Kaptan", "Admin"). */
  tag?: string;
  className?: string;
}

/**
 * Ahoy Boats logosu — "ahoy" büyük, altında "boats" (müşteri sitesiyle aynı dizilim).
 * Yazı tipi uygulamanın --font-sans değişkeninden (Manrope) gelir.
 */
export function AhoyLogo({ size = 30, tone = "brand", tag, className }: AhoyLogoProps) {
  const ahoy = tone === "light" ? "#FFFFFF" : "#183D85";
  const boats = tone === "light" ? "#7CCBEA" : "#2E9BC6";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        role="img"
        aria-label="Ahoy Boats"
        style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", fontSize: size, lineHeight: 1, whiteSpace: "nowrap" }}
      >
        <span aria-hidden style={{ fontWeight: 800, lineHeight: 0.8, letterSpacing: "-0.055em", color: ahoy }}>
          ahoy
        </span>
        <span
          aria-hidden
          style={{ marginTop: "0.1em", paddingLeft: "0.03em", fontWeight: 700, fontSize: "0.47em", letterSpacing: "-0.01em", color: boats }}
        >
          boats
        </span>
      </span>
      {tag ? (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
            tone === "light" ? "bg-white/15 text-white" : "bg-brand-50 text-brand-600"
          )}
        >
          {tag}
        </span>
      ) : null}
    </span>
  );
}
