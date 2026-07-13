import type { Metadata } from "next";
import Link from "next/link";
import {
  FontAwesomeIcon,
  faChevronRight,
  faCookieBite,
  faFileLines,
  faLock,
  faShieldHalved,
  type IconDefinition,
} from "@getyourboat/ui";
import { LegalTitle } from "./components";

export const metadata: Metadata = { title: "Yasal — SeaHub" };

const CARDS: Array<{
  href: string;
  icon: IconDefinition;
  title: string;
  desc: string;
}> = [
  {
    href: "/legal/terms",
    icon: faFileLines,
    title: "Kullanım Koşulları",
    desc: "Platform hizmetleri, kaptan yükümlülükleri, komisyon ve iptal politikası.",
  },
  {
    href: "/legal/privacy",
    icon: faShieldHalved,
    title: "Gizlilik Politikası",
    desc: "Toplanan veriler, kullanım amaçları, saklama süreleri ve haklarınız.",
  },
  {
    href: "/legal/kvkk",
    icon: faLock,
    title: "KVKK Aydınlatma Metni",
    desc: "6698 sayılı kanun kapsamında kişisel verilerin işlenmesi.",
  },
  {
    href: "/legal/cookies",
    icon: faCookieBite,
    title: "Çerez Politikası",
    desc: "Kullandığımız çerezler ve çerez yönetimi.",
  },
];

export default function LegalHubPage() {
  return (
    <div>
      <LegalTitle title="Yasal Bilgiler" />
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <FontAwesomeIcon icon={card.icon} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900">{card.title}</p>
              <p className="mt-1 text-sm text-gray-500">{card.desc}</p>
            </div>
            <FontAwesomeIcon
              icon={faChevronRight}
              className="mt-1 text-xs text-gray-300 transition group-hover:text-brand-500"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
