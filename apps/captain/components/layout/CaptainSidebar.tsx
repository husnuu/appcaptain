"use client";

import {
  Anchor,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Percent,
  Scale,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NavItem, Sidebar, SidebarBrand, cn } from "@getyourboat/ui";
import { useAuth } from "../auth-provider";

export type SidebarKey =
  | "dashboard"
  | "messages"
  | "boats"
  | "calendar"
  | "discounts"
  | "payments"
  | "legal"
  | "profile";

interface NavLink {
  key: SidebarKey;
  label: string;
  icon: LucideIcon;
  href: string;
  children?: { key: string; label: string; href: string }[];
}

const PRIMARY: NavLink[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { key: "messages", label: "Messages", icon: MessageSquare, href: "/messages" },
  {
    key: "boats",
    label: "Manage Boats",
    icon: Anchor,
    href: "/boats",
    children: [
      { key: "boats-all", label: "All Boats", href: "/boats" },
      { key: "boats-new", label: "Add Boat", href: "/boats/new" },
    ],
  },
  { key: "calendar", label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { key: "discounts", label: "Discounts", icon: Percent, href: "/discounts" },
  { key: "payments", label: "Payments", icon: Wallet, href: "/payments" },
  { key: "legal", label: "Legal & Payout", icon: Scale, href: "/legal" },
];

export function CaptainSidebar({ active }: { active: SidebarKey }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [boatsOpen, setBoatsOpen] = useState(active === "boats");

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <Sidebar className="sticky top-0 h-screen">
      <SidebarBrand>
        GetYourBoat <span className="text-brand-500">Captain</span>
      </SidebarBrand>

      <nav className="flex flex-1 flex-col gap-1">
        {PRIMARY.map((item) =>
          item.children ? (
            <div key={item.key}>
              <NavItem
                href={item.href}
                icon={item.icon}
                active={active === item.key}
                onClick={(e) => {
                  e.preventDefault();
                  setBoatsOpen((v) => !v);
                }}
                aria-expanded={boatsOpen}
              >
                <span className="flex-1">{item.label}</span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", boatsOpen && "rotate-180")}
                  aria-hidden
                />
              </NavItem>
              {boatsOpen ? (
                <div className="ml-7 mt-1 flex flex-col gap-1 border-l border-white/10 pl-2">
                  {item.children.map((child) => (
                    <a
                      key={child.key}
                      href={child.href}
                      onClick={go(child.href)}
                      className="rounded-lg px-3 py-1.5 text-body-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <NavItem
              key={item.key}
              href={item.href}
              icon={item.icon}
              active={active === item.key}
              onClick={go(item.href)}
            >
              {item.label}
            </NavItem>
          )
        )}
      </nav>

      <div className="mt-2 border-t border-white/10 pt-2">
        <NavItem
          href="/profile"
          icon={Settings}
          active={active === "profile"}
          onClick={go("/profile")}
        >
          Profile Settings
        </NavItem>
        <NavItem
          href="#"
          icon={LogOut}
          onClick={(e) => {
            e.preventDefault();
            void signOut();
          }}
        >
          Log out
        </NavItem>
      </div>
    </Sidebar>
  );
}
