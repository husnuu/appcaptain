"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Spinner } from "./ui";
import { useAuth } from "./auth-provider";

export function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  return <>{children}</>;
}

export function TopBar() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-10 bg-ink-800 text-white">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-3">
        <Link href="/" className="text-subheading font-bold text-white">
          GetYourBoat <span className="text-brand-500">Captain</span>
        </Link>
        <div className="flex items-center gap-3 text-body-sm text-gray-300">
          <span className="hidden sm:inline">{user?.email}</span>
          <button
            onClick={() => signOut()}
            className="rounded-lg border border-white/20 px-3 py-1.5 font-medium text-white transition hover:bg-white/10"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}
