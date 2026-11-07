"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Protected } from "../protected";
import { CaptainTopNav, type SidebarKey } from "./CaptainNav";

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Kullanım Koşulları" },
  { href: "/legal/privacy", label: "Gizlilik" },
  { href: "/legal/kvkk", label: "KVKK" },
  { href: "/legal/cookies", label: "Çerezler" },
];

/**
 * Oturum açılmış panel iskeleti: üstte menü (mobilde çekmece), ortada içerik.
 * Sayfalar `<AppShell active="...">{içerik}</AppShell>` olarak render edilir.
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
      <div className="flex min-h-screen flex-col bg-cream">
        <CaptainTopNav active={active} />
        <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-content px-4 pb-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-200 pt-5 text-caption text-gray-400">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-ink">
                {l.label}
              </Link>
            ))}
            <span className="ml-auto">© {new Date().getFullYear()} Ahoy Boats</span>
          </div>
        </footer>
      </div>
    </Protected>
  );
}
