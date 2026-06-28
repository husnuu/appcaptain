"use client";

import type { AuthUserDTO } from "@getyourboat/shared";
import { ProfileRole } from "@getyourboat/shared";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import {
  login as authLogin,
  logoutSession,
  refreshSession,
  signup as authSignup,
} from "../lib/auth/client";

interface AuthContextValue {
  user: AuthUserDTO | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  redirectAfterAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_USER: AuthUserDTO = {
  id: "demo-user",
  email: "demo@getyourboat.com",
  fullName: "Demo Kaptan",
  role: ProfileRole.OWNER,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserDTO | null>(DEMO_USER);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const redirectAfterAuth = useCallback(async () => {
    try {
      const { profile } = await api.getProfile();
      if (!profile?.isComplete) {
        router.replace("/profile/setup");
        return;
      }
      const { items } = await api.myBoats();
      if (items.length === 0) {
        router.replace("/boats");
        return;
      }
      router.replace("/");
    } catch {
      router.replace("/boats");
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    (async () => {
      const session = await refreshSession();
      if (!active) return;
      if (session) setUser(session.user);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      async signIn(email, password, rememberMe) {
        const session = await authLogin({ email, password, rememberMe });
        setUser(session.user);
      },
      async signUp(email, password, fullName) {
        const session = await authSignup({ email, password, fullName });
        setUser(session.user);
      },
      async signOut() {
        await logoutSession().catch(() => {});
        setUser(DEMO_USER);
        router.push("/");
      },
      redirectAfterAuth,
    }),
    [user, loading, router, redirectAfterAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
