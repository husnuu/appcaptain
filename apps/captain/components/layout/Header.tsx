"use client";

import { Bell, Globe, HelpCircle } from "lucide-react";
import { useAuth } from "../auth-provider";

export function Header({ hasNotifications = true }: { hasNotifications?: boolean }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-end gap-2 px-4 sm:px-6">
        <button
          type="button"
          aria-label="Bildirimler"
          className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          {hasNotifications ? (
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white"
            />
          ) : null}
        </button>

        <button
          type="button"
          aria-label="Dil seç"
          className="flex items-center gap-1 rounded-lg px-2 py-2 text-body-sm font-medium text-gray-600 transition hover:bg-gray-100"
        >
          <Globe className="h-4 w-4" />
          TR
        </button>

        <a
          href="#"
          className="flex items-center gap-1 rounded-lg px-2 py-2 text-body-sm font-medium text-gray-600 transition hover:bg-gray-100"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Help</span>
        </a>

        <div className="ml-2 hidden text-right sm:block">
          <div className="text-body-sm font-medium text-ink">{user?.email}</div>
        </div>
      </div>
    </header>
  );
}
