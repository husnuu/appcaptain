"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FontAwesomeIcon,
  faBell,
  faGlobe,
  faCircleQuestion,
  cn,
} from "@getyourboat/ui";
import { useAuth } from "../auth-provider";
import { api, ApiError } from "../../lib/api";
import { useProfile } from "../../lib/hooks";
import {
  APP_LOCALES,
  localeShort,
  persistLocale,
  readStoredLocale,
  type AppLocale,
} from "../../lib/locale";

type MenuKey = "notifications" | "language" | "help";

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [ref, onClose]);
}

function HeaderMenu({
  open,
  onClose,
  align = "right",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  align?: "right" | "left";
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full z-20 mt-1 min-w-[220px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg",
        align === "right" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const { data: profile, reload: reloadProfile } = useProfile(isAuthenticated);
  const [locale, setLocale] = useState<AppLocale>("tr");
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [localeBusy, setLocaleBusy] = useState(false);
  const [localeError, setLocaleError] = useState<string | null>(null);

  const { data: conversations } = useQuery({
    queryKey: ["header-conversations"],
    queryFn: () => api.listConversations().then((r) => r.items),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const unreadTotal =
    conversations?.reduce((sum, item) => sum + (item.unreadCount ?? 0), 0) ?? 0;

  useEffect(() => {
    const initial = readStoredLocale();
    setLocale(initial);
    persistLocale(initial);
  }, []);

  useEffect(() => {
    if (profile?.language && (profile.language === "tr" || profile.language === "en")) {
      setLocale(profile.language);
      persistLocale(profile.language);
    }
  }, [profile?.language]);

  const closeMenus = useCallback(() => setOpenMenu(null), []);

  async function selectLocale(next: AppLocale) {
    setLocale(next);
    persistLocale(next);
    setLocaleError(null);
    closeMenus();

    if (
      !profile?.fullName ||
      !profile.phone ||
      !profile.companyName ||
      !profile.avatarUrl ||
      !profile.address ||
      !profile.language
    ) {
      return;
    }

    setLocaleBusy(true);
    try {
      await api.updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        companyName: profile.companyName,
        avatarUrl: profile.avatarUrl,
        address: profile.address,
        language: next,
      });
      await reloadProfile();
    } catch (err) {
      setLocaleError(err instanceof ApiError ? err.message : "Dil kaydedilemedi");
    } finally {
      setLocaleBusy(false);
    }
  }

  function toggleMenu(key: MenuKey) {
    setOpenMenu((current) => (current === key ? null : key));
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-end gap-1 px-4 sm:gap-2 sm:px-6">
        <div className="relative">
          <button
            type="button"
            aria-label="Bildirimler"
            aria-expanded={openMenu === "notifications"}
            onClick={() => toggleMenu("notifications")}
            className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faBell} className="text-[18px]" />
            {unreadTotal > 0 ? (
              <span
                aria-hidden
                className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
              >
                {unreadTotal > 9 ? "9+" : unreadTotal}
              </span>
            ) : null}
          </button>
          <HeaderMenu open={openMenu === "notifications"} onClose={closeMenus}>
            {unreadTotal > 0 ? (
              <p className="border-b border-gray-100 px-3 py-2 text-body-sm text-gray-700">
                {unreadTotal} okunmamış mesaj
              </p>
            ) : (
              <p className="border-b border-gray-100 px-3 py-2 text-body-sm text-gray-500">
                Yeni bildirim yok
              </p>
            )}
            <Link
              href="/messages"
              onClick={closeMenus}
              className="block px-3 py-2 text-body-sm font-medium text-brand-600 hover:bg-gray-50"
            >
              Mesajlara git
            </Link>
          </HeaderMenu>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Dil seç"
            aria-expanded={openMenu === "language"}
            disabled={localeBusy}
            onClick={() => toggleMenu("language")}
            className="flex items-center gap-1 rounded-lg px-2 py-2 text-body-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faGlobe} className="text-[16px]" />
            {localeShort(locale)}
          </button>
          <HeaderMenu open={openMenu === "language"} onClose={closeMenus} className="min-w-[160px]">
            {APP_LOCALES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => void selectLocale(item.value)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-body-sm transition hover:bg-gray-50",
                  locale === item.value ? "font-semibold text-brand-600" : "text-gray-700"
                )}
              >
                <span>{item.label}</span>
                <span className="text-caption text-gray-400">{item.short}</span>
              </button>
            ))}
            {localeError ? (
              <p className="border-t border-gray-100 px-3 py-2 text-caption text-danger-600">
                {localeError}
              </p>
            ) : null}
          </HeaderMenu>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Yardım"
            aria-expanded={openMenu === "help"}
            onClick={() => toggleMenu("help")}
            className="flex items-center gap-1 rounded-lg px-2 py-2 text-body-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faCircleQuestion} className="text-[16px]" />
            <span className="hidden sm:inline">Yardım</span>
          </button>
          <HeaderMenu open={openMenu === "help"} onClose={closeMenus} className="min-w-[240px]">
            <Link
              href="/boats"
              onClick={closeMenus}
              className="block px-3 py-2 text-body-sm text-gray-700 hover:bg-gray-50"
            >
              Teknelerim — ilan yönetimi
            </Link>
            <Link
              href="/profile/setup"
              onClick={closeMenus}
              className="block px-3 py-2 text-body-sm text-gray-700 hover:bg-gray-50"
            >
              Profil ayarları
            </Link>
            <a
              href="mailto:destek@getyourboat.com?subject=GetYourBoat%20Kaptan%20Destek"
              onClick={closeMenus}
              className="block border-t border-gray-100 px-3 py-2 text-body-sm text-brand-600 hover:bg-gray-50"
            >
              Destek ekibine yaz
            </a>
          </HeaderMenu>
        </div>

        {isAuthenticated && user?.email ? (
          <div className="ml-2 hidden text-right sm:block">
            <div className="text-body-sm font-medium text-ink">{user.email}</div>
          </div>
        ) : (
          <Link
            href="/login"
            className="ml-2 rounded-lg px-3 py-2 text-body-sm font-medium text-brand-600 hover:bg-gray-100"
          >
            Giriş yap
          </Link>
        )}
      </div>
    </header>
  );
}
