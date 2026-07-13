"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Protected } from "../protected";
import { CaptainSidebar, type SidebarKey } from "./CaptainSidebar";
import { Header } from "./Header";

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Kullanım Koşulları" },
  { href: "/legal/privacy", label: "Gizlilik" },
  { href: "/legal/kvkk", label: "KVKK" },
  { href: "/legal/cookies", label: "Çerezler" },
];

/**
 * Authenticated panel chrome: fixed navy sidebar (desktop) + top header.
 * Pages render `<AppShell active="...">{content}</AppShell>`.
 */
export function AppShell({
  active,
  children,
}: {
  active: SidebarKey;
  children: ReactNode;
}) {
  return (
    <Protected>
      <div className="flex min-h-screen bg-white">
        <div className="hidden lg:block">
          <CaptainSidebar active={active} />
        </div>
        <div className="flex min-h-screen flex-1 flex-col bg-[#F8FAFC]">
          <Header />
          <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
          <footer className="mt-auto border-t border-gray-100 px-4 py-4 sm:px-6">
            <div className="mx-auto flex w-full max-w-content flex-wrap items-center gap-4 text-xs text-gray-400">
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-brand-600">
                  {l.label}
                </Link>
              ))}
              <span className="ml-auto">© {new Date().getFullYear()} SeaHub</span>
            </div>
          </footer>
        </div>
      </div>
    </Protected>
  );
}
