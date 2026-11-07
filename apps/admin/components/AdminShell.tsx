"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AhoyLogo,
  FontAwesomeIcon,
  cn,
  faBars,
  faBuilding,
  faCalendarCheck,
  faCircleQuestion,
  faClipboardList,
  faCommentDots,
  faGaugeHigh,
  faGear,
  faGlobe,
  faHeadset,
  faIdCard,
  faInbox,
  faMapLocationDot,
  faPercent,
  faRightFromBracket,
  faShip,
  faStar,
  faTags,
  faUsers,
  faWallet,
  faXmark,
  type IconDefinition,
} from "@getyourboat/ui";
import { api } from "../lib/api";

const LOCALES = [
  { value: "tr", label: "Türkçe", short: "TR" },
  { value: "en", label: "English", short: "EN" },
] as const;

type Locale = (typeof LOCALES)[number]["value"];
const STORAGE_KEY = "gyb-admin-locale";

function readLocale(): Locale {
  if (typeof window === "undefined") return "tr";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "tr";
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [ref, onClose]);
}

export function AdminTopBar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("tr");
  const [langOpen, setLangOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = readLocale();
    setLocale(initial);
    document.documentElement.lang = initial;
  }, []);

  const closeAll = useCallback(() => {
    setLangOpen(false);
    setHelpOpen(false);
  }, []);

  useClickOutside(langRef, () => setLangOpen(false));
  useClickOutside(helpRef, () => setHelpOpen(false));

  function selectLocale(next: Locale) {
    setLocale(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    closeAll();
  }

  function logout() {
    api.logout().finally(() => router.push("/login"));
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-cream/85 backdrop-blur-md">
      <div className="flex h-[68px] items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            aria-label="Menüyü aç"
            onClick={onOpenMenu}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faBars} className="text-[18px]" />
          </button>
          <Link href="/" aria-label="Ana sayfa">
            <AhoyLogo size={24} />
          </Link>
        </div>
        <div className="hidden lg:block" />

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="relative" ref={langRef}>
            <button
              type="button"
              aria-expanded={langOpen}
              onClick={() => {
                setHelpOpen(false);
                setLangOpen((v) => !v);
              }}
              className="flex h-10 items-center gap-1.5 rounded-full px-3 text-body-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-ink"
            >
              <FontAwesomeIcon icon={faGlobe} className="text-[16px]" />
              {locale.toUpperCase()}
            </button>
            {langOpen ? (
              <div className="absolute right-0 top-full z-20 mt-2 min-w-[160px] overflow-hidden rounded-2xl border border-gray-200 bg-white py-1.5 shadow-modal">
                {LOCALES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => selectLocale(item.value)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-body-sm hover:bg-gray-50",
                      locale === item.value ? "font-semibold text-brand-600" : "text-gray-700"
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="text-caption text-gray-400">{item.short}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative" ref={helpRef}>
            <button
              type="button"
              aria-expanded={helpOpen}
              onClick={() => {
                setLangOpen(false);
                setHelpOpen((v) => !v);
              }}
              className="flex h-10 items-center gap-1.5 rounded-full px-3 text-body-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-ink"
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="text-[16px]" />
              <span className="hidden sm:inline">Yardım</span>
            </button>
            {helpOpen ? (
              <div className="absolute right-0 top-full z-20 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-gray-200 bg-white py-1.5 shadow-modal">
                <Link
                  href="/brands"
                  onClick={closeAll}
                  className="block px-3 py-2 text-body-sm text-gray-700 hover:bg-gray-50"
                >
                  Marka / model yönetimi
                </Link>
                <Link
                  href="/brand-model-requests"
                  onClick={closeAll}
                  className="block px-3 py-2 text-body-sm text-gray-700 hover:bg-gray-50"
                >
                  Bekleyen talepler
                </Link>
                <Link
                  href="/discounts"
                  onClick={closeAll}
                  className="block px-3 py-2 text-body-sm text-gray-700 hover:bg-gray-50"
                >
                  İndirim yönetimi
                </Link>
                <a
                  href="mailto:destek@getyourboat.com?subject=Ahoy%20Admin%20Destek"
                  onClick={closeAll}
                  className="block border-t border-gray-100 px-3 py-2 text-body-sm text-brand-600 hover:bg-gray-50"
                >
                  Destek ekibine yaz
                </a>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={logout}
            className="ml-1 flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-body-sm font-semibold text-ink shadow-card transition hover:border-gray-300"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="text-[14px] text-gray-500" />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </div>
    </header>
  );
}

interface NavLinkItem {
  href: string;
  label: string;
  icon: IconDefinition;
  exact?: boolean;
}

const NAV_GROUPS: { title: string; items: NavLinkItem[] }[] = [
  {
    title: "Genel",
    items: [
      { href: "/", label: "Dashboard", icon: faGaugeHigh, exact: true },
      { href: "/map", label: "Harita", icon: faMapLocationDot },
    ],
  },
  {
    title: "Operasyon",
    items: [
      { href: "/boats", label: "İlanlar", icon: faShip },
      { href: "/experiences", label: "Deneyimler", icon: faStar },
      { href: "/reservations", label: "Rezervasyonlar", icon: faCalendarCheck },
      { href: "/users", label: "Kullanıcılar", icon: faUsers },
      { href: "/kyc", label: "KYC", icon: faIdCard },
    ],
  },
  {
    title: "Finans",
    items: [
      { href: "/finance", label: "Finans", icon: faWallet },
      { href: "/discounts", label: "İndirimler", icon: faPercent },
    ],
  },
  {
    title: "İçerik ve destek",
    items: [
      { href: "/reviews", label: "Yorumlar", icon: faCommentDots },
      { href: "/support", label: "Destek", icon: faHeadset },
      { href: "/notifications", label: "Bildirimler", icon: faInbox },
    ],
  },
  {
    title: "Katalog",
    items: [
      { href: "/brands", label: "Markalar", icon: faTags },
      { href: "/brand-model-requests", label: "Marka Talepleri", icon: faBuilding },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/settings", label: "Ayarlar", icon: faGear },
      { href: "/audit-log", label: "Denetim Kaydı", icon: faClipboardList },
    ],
  },
];

function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-5", className)} aria-label="Admin menüsü">
      <Link href="/" className="mb-6 inline-flex px-2 pt-1 transition-opacity hover:opacity-80" title="Dashboard">
        <AhoyLogo size={30} tag="Admin" />
      </Link>
      <div className="flex flex-col gap-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium tracking-[-0.01em] transition-colors",
                        active ? "bg-brand-50 font-semibold text-brand-600" : "text-gray-600 hover:bg-gray-100 hover:text-ink"
                      )}
                    >
                      <FontAwesomeIcon
                        icon={item.icon}
                        className={cn("w-5 shrink-0 text-[16px]", active ? "text-brand-500" : "text-gray-400 group-hover:text-gray-600")}
                        aria-hidden
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-cream">
      <div className="sticky top-0 hidden h-screen overflow-y-auto lg:block">
        <AdminSidebar className="min-h-full" />
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menü">
          <button
            type="button"
            aria-label="Menüyü kapat"
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] shadow-modal">
            <AdminSidebar className="h-full w-full overflow-y-auto" />
            <button
              type="button"
              aria-label="Menüyü kapat"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
            >
              <FontAwesomeIcon icon={faXmark} className="text-[16px]" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
