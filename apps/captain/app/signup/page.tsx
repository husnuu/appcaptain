"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@getyourboat/ui";
import { signupFormSchema } from "@getyourboat/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../components/auth-provider";
import { Alert, Field, Input } from "../../components/ui";

export default function SignupPage() {
  const { signUp, isAuthenticated, loading, redirectAfterAuth } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      void redirectAfterAuth();
    }
  }, [loading, isAuthenticated, redirectAfterAuth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = signupFormSchema.safeParse({
      email,
      password,
      confirmPassword,
      fullName,
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() ?? "form";
        if (!map[key]) map[key] = issue.message;
      }
      setFieldErrors(map);
      return;
    }

    setBusy(true);
    try {
      await signUp(parsed.data.email, parsed.data.password, parsed.data.fullName);
      await redirectAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Kaptan Kaydı</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <Field label="Ad Soyad" error={fieldErrors.fullName}>
              <Input
                error={!!fieldErrors.fullName}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Kaptan Ahmet"
              />
            </Field>
            <Field label="E-posta" error={fieldErrors.email}>
              <Input
                error={!!fieldErrors.email}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kaptan@example.com"
              />
            </Field>
            <Field label="Şifre" error={fieldErrors.password}>
              <Input
                error={!!fieldErrors.password}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
              />
            </Field>
            <Field label="Şifre Tekrar" error={fieldErrors.confirmPassword}>
              <Input
                error={!!fieldErrors.confirmPassword}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifreni tekrar gir"
              />
            </Field>
            <Button type="submit" className="w-full" loading={busy}>
              Kayıt ol
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              Giriş yap
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
