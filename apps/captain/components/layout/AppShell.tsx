"use client";

import type { ReactNode } from "react";
import { Protected } from "../protected";
import { CaptainSidebar, type SidebarKey } from "./CaptainSidebar";
import { Header } from "./Header";

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
      <div className="flex min-h-screen bg-gray-100">
        <div className="hidden lg:block">
          <CaptainSidebar active={active} />
        </div>
        <div className="flex min-h-screen flex-1 flex-col">
          <Header />
          <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </Protected>
  );
}
