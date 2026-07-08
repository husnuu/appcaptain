"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@getyourboat/ui";
import { captainLoginSchema } from "@getyourboat/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../components/auth-provider";
import { Alert, Checkbox, Field, Input } from "../../components/ui";

export default function LoginPage() {
  const { signIn, isAuthenticated, loading, redirectAfterAuth } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionExpired(params.get("expired") === "1");
    // Only honor internal, absolute-path redirects to avoid open-redirects.
    const target = params.get("redirect");
    setRedirectTo(target && target.startsWith("/") && !target.startsWith("//") ? target : null);
  }, []);

  const goAfterAuth = useCallback(async () => {
    if (redirectTo) {
      router.replace(redirectTo);
      return;
    }
    await redirectAfterAuth();
  }, [redirectTo, router, redirectAfterAuth]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      void goAfterAuth();
    }
  }, [loading, isAuthenticated, goAfterAuth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = captainLoginSchema.safeParse({ email, password, rememberMe });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Geçersiz giriş");
      return;
    }
    setBusy(true);
    try {
      await signIn(parsed.data.email, parsed.data.password, parsed.data.rememberMe);
      await goAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Kaptan Girişi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {sessionExpired ? (
              <Alert variant="warning">
                Oturumunuz sona erdi. Lütfen tekrar giriş yapın.
              </Alert>
            ) : null}
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <Field label="E-posta">
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kaptan@example.com"
              />
            </Field>
            <Field label="Şifre">
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <Checkbox
                label="Beni hatırla"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Link href="#" className="text-body-sm text-brand-600 hover:underline">
                Şifremi unuttum
              </Link>
            </div>
            <Button type="submit" className="w-full" loading={busy}>
              Giriş yap
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Hesabın yok mu?{" "}
            <Link href="/signup" className="font-medium text-brand-600 hover:underline">
              Kayıt ol
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
