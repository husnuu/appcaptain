"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
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
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
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
    <header className="sticky top-0 z-10 bg-ink-800 text-white">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-3">
        <Link href="/" className="text-subheading font-bold text-white">
          SEAHUB <span className="text-brand-500">Captain</span>
        </Link>
        <div className="flex items-center gap-3 text-body-sm text-gray-300">
          {isAuthenticated && user?.email ? (
            <span className="hidden sm:inline">{user.email}</span>
          ) : (
            <Link href="/login" className="text-white hover:underline">
              Giriş yap
            </Link>
          )}
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
