"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@getyourboat/ui";
import { Protected, TopBar } from "../../../components/protected";
import { useAuth } from "../../../components/auth-provider";
import { Alert, Field, Input, Select, Spinner } from "../../../components/ui";
import { api, ApiError, uploadToStorage } from "../../../lib/api";
import { useProfile } from "../../../lib/hooks";

const LANGUAGES = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
];

function ProfileSetupForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile, loading, error, reload } = useProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [language, setLanguage] = useState("tr");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setPhone(profile.phone ?? "");
    setCompanyName(profile.companyName ?? "");
    setAddress(profile.address ?? "");
    setLanguage(profile.language ?? "tr");
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile]);

  async function onAvatar(file: File) {
    setUploading(true);
    setSaveError(null);
    try {
      const upload = await api.profileAvatarUploadUrl(file.name);
      await uploadToStorage(upload, file);
      setAvatarUrl(upload.publicUrl);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Fotoğraf yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setBusy(true);
    setSaveError(null);
    try {
      await api.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        companyName: companyName.trim(),
        avatarUrl: avatarUrl.trim(),
        address: address.trim(),
        language,
      });
      await reload();
      router.push("/boats");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-1">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Profil bilgileri</h1>
        <p className="text-body-sm text-gray-500">
          Tekne eklemeye başlamadan önce iletişim bilgilerini tamamla. E-posta ve şifre Supabase
          hesabın üzerinden yönetilir.
        </p>
      </div>

      {error || saveError ? (
        <div className="mb-4">
          <Alert>{error ?? saveError}</Alert>
        </div>
      ) : null}

      <div className="space-y-6">
        <Field label="E-posta">
          <Input value={user?.email ?? profile?.email ?? ""} disabled />
        </Field>

        <Field label="Ad Soyad *">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>

        <Field label="Telefon *">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>

        <Field label="Şirket / işletme adı *">
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </Field>

        <Field label="Profil fotoğrafı / logo *">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Profil"
                className="h-16 w-16 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">
                Logo
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onAvatar(f);
                e.target.value = "";
              }}
              className="text-sm"
            />
            {uploading ? <Spinner /> : null}
          </div>
        </Field>

        <Field label="Adres / konum *">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>

        <Field label="Dil *">
          <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-8 flex justify-end">
        <Button size="lg" loading={busy} onClick={save}>
          Kaydet ve devam et
        </Button>
      </div>
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Protected>
      <div className="min-h-screen bg-white">
        <TopBar />
        <ProfileSetupForm />
      </div>
    </Protected>
  );
}
