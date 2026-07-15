"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon, faGlobe, faCircleQuestion, cn, buttonVariants } from "@getyourboat/ui";
import { clearAdminToken } from "../lib/auth";

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

export function AdminTopBar() {
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
    clearAdminToken();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex flex-col leading-tight transition-opacity hover:opacity-80"
          title="Ana sayfaya dön"
        >
          <span
            className="font-bold"
            style={{ fontFamily: 'var(--font-serif), Georgia, "Times New Roman", serif', fontSize: "24px", lineHeight: 1.1 }}
          >
            <span style={{ color: "#4BAFD6" }}>Sea</span>
            <span style={{ color: "#1E3A7A" }}> Hub</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="relative" ref={langRef}>
            <button
              type="button"
              aria-expanded={langOpen}
              onClick={() => {
                setHelpOpen(false);
                setLangOpen((v) => !v);
              }}
              className="flex items-center gap-1 rounded-lg px-2 py-2 text-body-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faGlobe} className="text-[16px]" />
              {locale.toUpperCase()}
            </button>
            {langOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
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
              className="flex items-center gap-1 rounded-lg px-2 py-2 text-body-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="text-[16px]" />
              <span className="hidden sm:inline">Yardım</span>
            </button>
            {helpOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[220px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
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
                  href="mailto:destek@getyourboat.com?subject=GetYourBoat%20Admin%20Destek"
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
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}

const NAV_ITEMS = [
  { href: "/boats", label: "İlanlar" },
  { href: "/users", label: "Kullanıcılar" },
  { href: "/discounts", label: "İndirimler" },
  { href: "/brands", label: "Markalar" },
  { href: "/brand-model-requests", label: "Marka Talepleri" },
];

function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:block">
      <div className="sticky top-14 pt-4 pb-8">
        <ul className="space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopBar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
