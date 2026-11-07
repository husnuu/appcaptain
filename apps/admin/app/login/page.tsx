"use client";

import { Alert, AuthLayout, Button, Field, Input } from "@getyourboat/ui";
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
    <AuthLayout
      tag="Admin"
      title="Yönetim paneline giriş"
      subtitle="İlan onayları, rezervasyonlar, kullanıcılar ve finans tek yerde."
      imageTitle="Ahoy Boats operasyon merkezi"
      imageText="Platformdaki ilanları denetle, kaptanları onayla ve rezervasyon akışını yönet."
      highlights={["İlan moderasyonu", "Finans raporları", "Denetim kaydı"]}
      footer={<>© {new Date().getFullYear()} Ahoy Boats · Yalnızca yetkili personel</>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <Field label="E-posta">
          <Input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ad@ahoyboats.com"
            required
          />
        </Field>
        <Field label="Şifre">
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Giriş yap
        </Button>
      </form>
    </AuthLayout>
  );
}
