"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@getyourboat/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../components/auth-provider";
import { Alert, Field, Input } from "../../components/ui";

export default function LoginPage() {
  const { signIn, signUp, session, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace("/");
  }, [loading, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        router.replace("/");
      } else {
        await signUp(email, password, fullName);
        setNotice(
          "Kayıt oluşturuldu. E-posta doğrulaması açıksa gelen kutunu kontrol et, sonra giriş yap."
        );
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {mode === "signin" ? "Kaptan Girişi" : "Kaptan Kaydı"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? <Alert>{error}</Alert> : null}
            {notice ? <Alert variant="success">{notice}</Alert> : null}
            {mode === "signup" ? (
              <Field label="Ad Soyad">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Kaptan Ahmet"
                />
              </Field>
            ) : null}
            <Field label="E-posta">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kaptan@example.com"
              />
            </Field>
            <Field label="Şifre">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy
                ? "Lütfen bekleyin…"
                : mode === "signin"
                  ? "Giriş yap"
                  : "Kayıt ol"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            {mode === "signin" ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
            <button
              className="font-medium text-brand-600 hover:underline"
              onClick={() => {
                setError(null);
                setNotice(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
            >
              {mode === "signin" ? "Kayıt ol" : "Giriş yap"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
