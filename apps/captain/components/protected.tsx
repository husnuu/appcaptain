"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AhoyLogo } from "@getyourboat/ui";
import { useAuth } from "./auth-provider";
import { Spinner } from "./ui";

/**
 * Client-side auth guard for all authenticated app pages. While the session is
 * being restored we show a spinner; once resolved, unauthenticated visitors are
 * redirected to the login page with a `redirect` param so they return to the
 * page they were trying to reach after signing in.
 */
export function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || isAuthenticated) return;
    const target = pathname && pathname !== "/" ? pathname : null;
    const query = target ? `?redirect=${encodeURIComponent(target)}` : "";
    router.replace(`/login${query}`);
  }, [loading, isAuthenticated, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F3]">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

export function TopBar() {
  const { user, isAuthenticated, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-3">
        <Link href="/" className="inline-flex transition-opacity hover:opacity-80" title="Ana sayfaya dön">
          <AhoyLogo size={26} tag="Kaptan" />
        </Link>
        <div className="flex items-center gap-3 text-body-sm text-gray-600">
          {isAuthenticated && user?.email ? (
            <span className="hidden sm:inline">{user.email}</span>
          ) : (
            <Link href="/login" className="font-semibold text-brand-600 hover:underline">
              Giriş yap
            </Link>
          )}
          <button
            onClick={() => signOut()}
            className="rounded-full border border-gray-300 bg-white px-4 py-1.5 font-semibold text-ink transition hover:bg-gray-100"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}
