import Link from "next/link";
import { AhoyLogo } from "@getyourboat/ui";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/legal/terms", label: "Kullanım Koşulları" },
  { href: "/legal/privacy", label: "Gizlilik Politikası" },
  { href: "/legal/kvkk", label: "KVKK" },
  { href: "/legal/cookies", label: "Çerez Politikası" },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-gray-200 bg-cream/85 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href="/" className="inline-flex transition-opacity hover:opacity-80">
            <AhoyLogo size={26} tag="Kaptan" />
          </Link>
          <Link
            href="/"
            className="ml-auto text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Panele dön
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">{children}</main>

      <footer className="mt-12 border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-4 px-6 text-sm text-gray-400">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-gray-600">
              {l.label}
            </Link>
          ))}
          <span className="ml-auto">
            © {new Date().getFullYear()} Ahoy Boats. Tüm hakları saklıdır.
          </span>
        </div>
      </footer>
    </div>
  );
}
