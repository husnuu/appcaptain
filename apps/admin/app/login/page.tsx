"use client";

import { Button, Field, Input } from "@getyourboat/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(email, password);
      router.push("/boats");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Giriş başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <h1 className="text-2xl font-bold text-brand-700">Admin Girişi</h1>
      <p className="mt-1 text-slate-600">Marka/model yönetimi için oturum açın.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Field label="E-posta">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Şifre">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? "Giriş yapılıyor…" : "Giriş yap"}
        </Button>
      </form>
    </main>
  );
}
