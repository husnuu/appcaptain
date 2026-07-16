"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell } from "./AdminShell";
import { api } from "../lib/api";

export function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/login") return;
    // Verify session is valid on every navigation; redirect to login if cookie is missing or expired
    api.me().catch(() => router.replace("/login"));
  }, [pathname, router]);

  if (pathname === "/login") return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}
