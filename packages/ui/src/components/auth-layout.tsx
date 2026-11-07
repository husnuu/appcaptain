import * as React from "react";
import { AhoyLogo } from "./ahoy-logo";

export interface AuthLayoutProps {
  /** Logonun yanındaki etiket — "Kaptan" veya "Admin". */
  tag: string;
  title: string;
  subtitle?: string;
  /** Sağ bölmedeki görsel (uygulamanın public klasöründen). */
  imageSrc?: string;
  /** Görselin üstündeki başlık ve açıklama. */
  imageTitle?: string;
  imageText?: string;
  /** Görselin altındaki küçük maddeler. */
  highlights?: string[];
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * İki bölmeli giriş/kayıt düzeni: solda form, sağda tekne görseli.
 * Mobilde yalnızca form gösterilir.
 */
export function AuthLayout({
  tag,
  title,
  subtitle,
  imageSrc = "/auth-hero.webp",
  imageTitle,
  imageText,
  highlights,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-cream">
      <div className="flex w-full flex-col px-6 py-8 sm:px-10 lg:w-[46%] lg:px-16 xl:px-24">
        <AhoyLogo size={32} tag={tag} />
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-[420px] py-10">
            <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink">{title}</h1>
            {subtitle ? <p className="mt-3 text-body text-gray-500">{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
          </div>
        </div>
        {footer ? <div className="text-caption text-gray-400">{footer}</div> : null}
      </div>

      <div className="relative hidden flex-1 p-4 lg:block">
        <div className="relative h-full overflow-hidden rounded-[28px] bg-brand-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A39]/85 via-[#0A1A39]/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
            {imageTitle ? (
              <h2 className="max-w-[520px] text-[36px] font-extrabold leading-[1.1] tracking-[-0.03em]">{imageTitle}</h2>
            ) : null}
            {imageText ? <p className="mt-4 max-w-[460px] text-body text-white/85">{imageText}</p> : null}
            {highlights?.length ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {highlights.map((h) => (
                  <li key={h} className="rounded-full bg-white/15 px-3.5 py-1.5 text-body-sm font-semibold backdrop-blur">
                    {h}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
