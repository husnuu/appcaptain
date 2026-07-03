"use client";

import { useRouter } from "next/navigation";
import {
  NavItem,
  Sidebar,
  SidebarBrand,
  faAnchor,
  faCalendarDays,
  faGaugeHigh,
  faRightFromBracket,
  faComments,
  faPercent,
  faStar,
  faWallet,
  faScaleBalanced,
  faGear,
  type IconDefinition,
} from "@getyourboat/ui";
import { useAuth } from "../auth-provider";

export type SidebarKey =
  | "dashboard"
  | "messages"
  | "boats"
  | "experiences"
  | "calendar"
  | "discounts"
  | "payments"
  | "legal"
  | "profile";

interface NavLink {
  key: SidebarKey;
  label: string;
  icon: IconDefinition;
  href: string;
}

const PRIMARY: NavLink[] = [
  { key: "dashboard", label: "Ana Sayfa", icon: faGaugeHigh, href: "/" },
  { key: "boats", label: "Teknelerim", icon: faAnchor, href: "/boats" },
  { key: "experiences", label: "Deneyimlerim", icon: faStar, href: "/experiences" },
  { key: "calendar", label: "Takvim", icon: faCalendarDays, href: "/calendar" },
  { key: "messages", label: "Mesajlar", icon: faComments, href: "/messages" },
  { key: "payments", label: "Ödemeler", icon: faWallet, href: "/payments" },
  { key: "discounts", label: "İndirim", icon: faPercent, href: "/discounts" },
  { key: "legal", label: "Yasal", icon: faScaleBalanced, href: "/legal" },
];

export function CaptainSidebar({ active }: { active: SidebarKey }) {
  const router = useRouter();
  const { signOut } = useAuth();

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <Sidebar className="sticky top-0 h-screen">
      <SidebarBrand>
        SEAHUB <span className="text-brand-500">Captain</span>
      </SidebarBrand>

      <nav className="flex flex-1 flex-col gap-1">
        {PRIMARY.map((item) => (
          <NavItem
            key={item.key}
            href={item.href}
            icon={item.icon}
            active={active === item.key}
            onClick={go(item.href)}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>

      <div className="mt-2 border-t border-white/10 pt-2">
        <NavItem
          href="/profile"
          icon={faGear}
          active={active === "profile"}
          onClick={go("/profile")}
        >
          Profil Ayarları
        </NavItem>
        <NavItem
          href="#"
          icon={faRightFromBracket}
          onClick={(e) => {
            e.preventDefault();
            void signOut();
          }}
        >
          Çıkış
        </NavItem>
      </div>
    </Sidebar>
  );
}
