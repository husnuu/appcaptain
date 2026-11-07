"use client";

/**
 * Kaptan panelinin üst menüsü: logo, ana sayfalar, "Tekne ekle", bildirimler ve
 * hesap menüsü. Mobilde menü, soldan açılan çekmecede gösterilir.
 */

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AhoyLogo,
  cn,
  FontAwesomeIcon,
  faAnchor,
  faBars,
  faBell,
  faCalendarCheck,
  faCalendarDays,
  faCircleQuestion,
  faComments,
  faGaugeHigh,
  faGear,
  faPercent,
  faPlus,
  faRightFromBracket,
  faScaleBalanced,
  faStar,
  faWallet,
  faXmark,
  type IconDefinition,
} from "@getyourboat/ui";
import { BookingStatus } from "@getyourboat/shared";
import { useAuth } from "../auth-provider";
import { api, ApiError } from "../../lib/api";
import { useProfile } from "../../lib/hooks";
import {
  APP_LOCALES,
  persistLocale,
  readStoredLocale,
  type AppLocale,
} from "../../lib/locale";

export type SidebarKey =
  | "dashboard"
  | "messages"
  | "boats"
  | "experiences"
  | "calendar"
  | "bookings"
  | "discounts"
  | "payments"
  | "legal"
  | "profile";

interface NavLink {
  key: SidebarKey;
  label: string;
  href: string;
  icon: IconDefinition;
}

const PRIMARY: NavLink[] = [
  { key: "dashboard", label: "Ana Sayfa", href: "/", icon: faGaugeHigh },
  { key: "bookings", label: "Rezervasyonlar", href: "/bookings", icon: faCalendarCheck },
  { key: "calendar", label: "Takvim", href: "/calendar", icon: faCalendarDays },
  { key: "messages", label: "Mesajlar", href: "/messages", icon: faComments },
  { key: "boats", label: "Teknelerim", href: "/boats", icon: faAnchor },
  { key: "experiences", label: "Deneyimlerim", href: "/experiences", icon: faStar },
];

const SECONDARY: NavLink[] = [
  { key: "payments", label: "Ödemeler", href: "/payments", icon: faWallet },
  { key: "discounts", label: "İndirimler", href: "/discounts", icon: faPercent },
  { key: "profile", label: "Profil ayarları", href: "/profile", icon: faGear },
  { key: "legal", label: "Yasal", href: "/legal", icon: faScaleBalanced },
];

const SUPPORT_MAIL = "mailto:destek@getyourboat.com?subject=Ahoy%20Kaptan%20Destek";

/** Rozet sayıları; kritik değil, hatalar sessizce yok sayılır. */
function useNavCounts(enabled: boolean) {
  const { data: pendingBookings } = useQuery({
    queryKey: ["nav-pending-bookings"],
    queryFn: () =>
      api
        .listCaptainBookings({ status: BookingStatus.PENDING, limit: 1 })
        .then((r) => r.pendingCount),
    enabled,
    staleTime: 30_000,
  });
  const { data: unread } = useQuery({
    queryKey: ["header-guest-unread"],
    queryFn: () => api.guestUnreadCount(),
    enabled,
    staleTime: 30_000,
  });
  return { pendingBookings: pendingBookings ?? 0, unreadMessages: unread?.count ?? 0 };
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1.5 text-[11px] font-bold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
}

function MenuPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "absolute right-0 top-[calc(100%+10px)] z-40 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-modal",
        className
      )}
    >
      {children}
    </div>
  );
}

const menuItemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-ink transition hover:bg-gray-50";

export function CaptainTopNav({ active }: { active: SidebarKey }) {
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuth();
  const { data: profile, reload: reloadProfile } = useProfile(isAuthenticated);
  const { pendingBookings, unreadMessages } = useNavCounts(isAuthenticated);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState<"notifications" | "account" | null>(null);
  const [locale, setLocale] = useState<AppLocale>("tr");
  const [localeBusy, setLocaleBusy] = useState(false);
  const [localeError, setLocaleError] = useState<string | null>(null);

  const closeMenu = useCallback(() => setMenu(null), []);
  const notificationsRef = useDismiss(menu === "notifications", closeMenu);
  const accountRef = useDismiss(menu === "account", closeMenu);

  useEffect(() => {
    setDrawer(false);
    setMenu(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

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

  async function selectLocale(next: AppLocale) {
    setLocale(next);
    persistLocale(next);
    setLocaleError(null);

    // Profil eksikse yalnızca tarayıcıda saklanır (profil güncellemesi tüm alanları ister).
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

  const badgeFor = (key: SidebarKey) =>
    key === "bookings" ? pendingBookings : key === "messages" ? unreadMessages : 0;
  const displayName = profile?.fullName || user?.email || "Kaptan";
  const initial = displayName.charAt(0).toLocaleUpperCase("tr-TR");
  const notificationTotal = pendingBookings + unreadMessages;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-content items-center gap-2 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Menüyü aç"
            onClick={() => setDrawer(true)}
            className="-ml-1 grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-gray-100 lg:hidden"
          >
            <FontAwesomeIcon icon={faBars} className="text-[18px]" />
          </button>

          <Link
            href="/"
            className="mr-2 shrink-0 transition-opacity hover:opacity-80 lg:mr-6"
            aria-label="Kaptan paneli ana sayfası"
          >
            <AhoyLogo size={26} tag="Kaptan" />
          </Link>

          <nav aria-label="Ana menü" className="hidden h-full items-stretch lg:flex">
            {PRIMARY.map((item) => {
              const on = active === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 text-[14.5px] font-semibold transition-colors",
                    on ? "text-brand-500" : "text-gray-600 hover:text-ink"
                  )}
                >
                  {item.label}
                  <Badge count={badgeFor(item.key)} />
                  {on ? (
                    <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-brand-500" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/boats/new"
              className="hidden items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-[14px] font-semibold text-ink transition hover:border-ink min-[1280px]:inline-flex"
            >
              <FontAwesomeIcon icon={faPlus} className="text-[12px]" aria-hidden />
              Tekne ekle
            </Link>

            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                aria-label="Bildirimler"
                aria-expanded={menu === "notifications"}
                onClick={() => setMenu((m) => (m === "notifications" ? null : "notifications"))}
                className="relative grid h-10 w-10 place-items-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-ink"
              >
                <FontAwesomeIcon icon={faBell} className="text-[18px]" />
                {notificationTotal > 0 ? (
                  <span
                    aria-hidden
                    className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
                  >
                    {notificationTotal > 9 ? "9+" : notificationTotal}
                  </span>
                ) : null}
              </button>
              {menu === "notifications" ? (
                <MenuPanel className="w-[300px]">
                  <p className="px-3 pb-1 pt-2 text-[13px] font-bold text-ink">Bildirimler</p>
                  {notificationTotal === 0 ? (
                    <p className="px-3 py-3 text-[14px] text-gray-500">Yeni bildirim yok.</p>
                  ) : null}
                  {pendingBookings > 0 ? (
                    <Link href="/bookings" className={menuItemClass}>
                      <FontAwesomeIcon icon={faCalendarCheck} className="w-4 text-accent-600" aria-hidden />
                      <span className="flex-1">{pendingBookings} bekleyen rezervasyon talebi</span>
                    </Link>
                  ) : null}
                  {unreadMessages > 0 ? (
                    <Link href="/messages" className={menuItemClass}>
                      <FontAwesomeIcon icon={faComments} className="w-4 text-accent-600" aria-hidden />
                      <span className="flex-1">{unreadMessages} okunmamış mesaj</span>
                    </Link>
                  ) : null}
                  <Link
                    href="/messages"
                    className="mt-1 block border-t border-gray-100 px-3 py-2.5 text-[13.5px] font-semibold text-brand-500 hover:underline"
                  >
                    Mesajlara git
                  </Link>
                </MenuPanel>
              ) : null}
            </div>

            {isAuthenticated && user?.email ? (
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  aria-label="Hesap menüsü"
                  aria-expanded={menu === "account"}
                  onClick={() => setMenu((m) => (m === "account" ? null : "account"))}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 transition hover:border-gray-300 hover:shadow-card"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-[13px] font-bold text-white">
                    {initial}
                  </span>
                  <span className="hidden max-w-[140px] truncate pr-2 text-[14px] font-semibold text-ink xl:block">
                    {displayName}
                  </span>
                </button>
                {menu === "account" ? (
                  <MenuPanel className="w-[280px]">
                    <div className="border-b border-gray-100 px-3 pb-3 pt-2">
                      <p className="truncate text-[14.5px] font-bold text-ink">{displayName}</p>
                      <p className="truncate text-[13px] text-gray-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {SECONDARY.map((item) => (
                        <Link key={item.key} href={item.href} className={menuItemClass}>
                          <FontAwesomeIcon icon={item.icon} className="w-4 text-gray-400" aria-hidden />
                          {item.label}
                        </Link>
                      ))}
                      <a href={SUPPORT_MAIL} className={menuItemClass}>
                        <FontAwesomeIcon icon={faCircleQuestion} className="w-4 text-gray-400" aria-hidden />
                        Destek ekibine yaz
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-3 py-2.5">
                      <span className="text-[13.5px] font-medium text-gray-500">Dil</span>
                      <div className="flex rounded-full bg-gray-100 p-0.5">
                        {APP_LOCALES.map((l) => (
                          <button
                            key={l.value}
                            type="button"
                            disabled={localeBusy}
                            onClick={() => void selectLocale(l.value)}
                            className={cn(
                              "rounded-full px-3 py-1 text-[12.5px] font-bold transition disabled:opacity-60",
                              locale === l.value ? "bg-white text-ink shadow-sm" : "text-gray-500 hover:text-ink"
                            )}
                          >
                            {l.short}
                          </button>
                        ))}
                      </div>
                    </div>
                    {localeError ? (
                      <p className="px-3 pb-2 text-[12.5px] text-danger-600">{localeError}</p>
                    ) : null}
                    <div className="border-t border-gray-100 pt-1">
                      <button type="button" onClick={() => void signOut()} className={menuItemClass}>
                        <FontAwesomeIcon icon={faRightFromBracket} className="w-4 text-gray-400" aria-hidden />
                        Çıkış yap
                      </button>
                    </div>
                  </MenuPanel>
                ) : null}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-brand-500 px-4 py-2 text-[14px] font-semibold text-white hover:bg-brand-600"
              >
                Giriş yap
              </Link>
            )}
          </div>
        </div>
      </header>

      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menü">
          <button
            type="button"
            aria-label="Menüyü kapat"
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
            onClick={() => setDrawer(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-80 max-w-[86vw] flex-col bg-white shadow-modal">
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-100 px-5">
              <AhoyLogo size={26} tag="Kaptan" />
              <button
                type="button"
                aria-label="Menüyü kapat"
                onClick={() => setDrawer(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-gray-600"
              >
                <FontAwesomeIcon icon={faXmark} className="text-[16px]" />
              </button>
            </div>
            <nav aria-label="Menü" className="flex-1 overflow-y-auto px-3 py-4">
              {PRIMARY.map((item) => (
                <DrawerLink key={item.key} item={item} active={active === item.key} badge={badgeFor(item.key)} />
              ))}
              <div className="my-3 border-t border-gray-100" />
              {SECONDARY.map((item) => (
                <DrawerLink key={item.key} item={item} active={active === item.key} />
              ))}
              <a href={SUPPORT_MAIL} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-gray-600 hover:bg-gray-50">
                <FontAwesomeIcon icon={faCircleQuestion} className="w-5 text-gray-400" aria-hidden />
                Destek ekibine yaz
              </a>
            </nav>
            <div className="space-y-2 border-t border-gray-100 p-4">
              <Link
                href="/boats/new"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-[15px] font-semibold text-white"
              >
                <FontAwesomeIcon icon={faPlus} className="text-[13px]" aria-hidden />
                Tekne ekle
              </Link>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-[15px] font-semibold text-ink"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="text-[13px]" aria-hidden />
                  Çıkış yap
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function DrawerLink({ item, active, badge = 0 }: { item: NavLink; active: boolean; badge?: number }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition",
        active ? "bg-brand-50 font-semibold text-brand-600" : "text-gray-600 hover:bg-gray-50 hover:text-ink"
      )}
    >
      <FontAwesomeIcon
        icon={item.icon}
        className={cn("w-5 text-[16px]", active ? "text-brand-500" : "text-gray-400")}
        aria-hidden
      />
      <span className="flex-1">{item.label}</span>
      <Badge count={badge} />
    </Link>
  );
}
