"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  NavItem,
  Sidebar,
  SidebarBrand,
  faAnchor,
  faCalendarCheck,
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
import { BookingStatus } from "@getyourboat/shared";
import { api } from "../../lib/api";
import { useAuth } from "../auth-provider";

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
  icon: IconDefinition;
  href: string;
}

const PRIMARY: NavLink[] = [
  { key: "dashboard", label: "Ana Sayfa", icon: faGaugeHigh, href: "/" },
  { key: "boats", label: "Teknelerim", icon: faAnchor, href: "/boats" },
  { key: "experiences", label: "Deneyimlerim", icon: faStar, href: "/experiences" },
  { key: "calendar", label: "Takvim", icon: faCalendarDays, href: "/calendar" },
  { key: "bookings", label: "Rezervasyonlar", icon: faCalendarCheck, href: "/bookings" },
  { key: "messages", label: "Mesajlar", icon: faComments, href: "/messages" },
  { key: "payments", label: "Ödemeler", icon: faWallet, href: "/payments" },
  { key: "discounts", label: "İndirim", icon: faPercent, href: "/discounts" },
  { key: "legal", label: "Yasal", icon: faScaleBalanced, href: "/legal" },
];

export function CaptainSidebar({ active }: { active: SidebarKey }) {
  const router = useRouter();
  const { signOut, isAuthenticated } = useAuth();
  const [pendingBookings, setPendingBookings] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Bekleyen rezervasyon talebi + okunmamış mesaj sayısını rozet için çek
  // (yalnızca giriş yapılmışsa; rozetler kritik değil, hataları yut).
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void api
      .listCaptainBookings({ status: BookingStatus.PENDING, limit: 1 })
      .then((res) => {
        if (!cancelled) setPendingBookings(res.pendingCount);
      })
      .catch(() => {});
    void api
      .guestUnreadCount()
      .then((res) => {
        if (!cancelled) setUnreadMessages(res.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <Sidebar className="sticky top-0 h-screen bg-primary-700">
      <SidebarBrand>
        <Link
          href="/"
          title="Ana sayfaya dön"
          className="flex flex-col leading-tight transition-opacity hover:opacity-80"
        >
          <span
            className="font-bold"
            style={{ fontFamily: 'var(--font-serif), Georgia, "Times New Roman", serif', fontSize: "26px", lineHeight: 1.1 }}
          >
            <span style={{ color: "#4BAFD6" }}>Sea</span>
            {/* Koyu lacivert sidebar üzerinde okunabilirlik için "Hub" beyaz. */}
            <span className="text-white"> Hub</span>
          </span>
          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-slate-400">
            Captain
          </span>
        </Link>
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
            <span className="flex-1">{item.label}</span>
            {item.key === "bookings" && pendingBookings > 0 ? (
              <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-bold text-white">
                {pendingBookings}
              </span>
            ) : null}
            {item.key === "messages" && unreadMessages > 0 ? (
              <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-bold text-white">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            ) : null}
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
