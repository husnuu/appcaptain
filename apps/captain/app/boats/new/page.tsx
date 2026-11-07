"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AhoyLogo, Button, FontAwesomeIcon, faArrowRight } from "@getyourboat/ui";
import { Protected } from "../../../components/protected";
import { Alert } from "../../../components/ui";
import { TopBarButton, WizardFooterBar } from "../../../components/wizard/focus";
import { api, ApiError } from "../../../lib/api";
import { useProfile } from "../../../lib/hooks";

/** Sihirbazın adımlarını özetleyen giriş ekranı maddeleri. */
const STEPS = [
  {
    title: "Teknen hakkında bilgi ver",
    text: "Kiralama modelini, tekne tipini, markasını ve temel özelliklerini paylaş.",
  },
  {
    title: "Donanımlar, konum ve teknik detaylar",
    text: "Teknendeki donanımları işaretle, marinayı haritada göster; motor ve kabin bilgilerini ekle.",
  },
  {
    title: "Fotoğraf ve fiyatlarla öne çık",
    text: "Kaliteli fotoğraflar yükle, fiyatlarını ve ek hizmetlerini belirle.",
  },
  {
    title: "Belgeleri yükle, incelemeye gönder",
    text: "Ekibimiz ilanını kontrol eder; onaylandığında her şeyi kaptan panelinden yönetirsin.",
  },
];

function NewBoatIntro() {
  const router = useRouter();
  const { data: profile, loading } = useProfile(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (profile && !profile.isComplete) {
      router.push("/profile/setup");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const boat = await api.createBoat();
      router.push(`/boats/${boat.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tekne oluşturulamadı");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-4 sm:h-[76px] sm:px-8">
          <Link href="/" className="transition-opacity hover:opacity-80" aria-label="Kaptan paneli ana sayfası">
            <AhoyLogo size={27} />
          </Link>
          <TopBarButton onClick={() => router.push("/boats")}>Çık</TopBarButton>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1200px] gap-12 px-5 pb-40 pt-12 sm:px-8 lg:min-h-[calc(100vh-76px-80px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-20 lg:py-16">
        <div>
          <p className="text-[14px] font-semibold text-accent-600">Yeni tekne ilanı</p>
          <h1 className="mt-3 text-[40px] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[56px] lg:text-[64px]">
            Ahoy ile tekneni hızlıca listele
          </h1>
          <p className="mt-5 max-w-[440px] text-[17px] leading-relaxed text-gray-500">
            Bilgilerin her adımda otomatik kaydedilir; istediğin zaman ara verip kaldığın yerden
            devam edebilirsin.
          </p>
          {error ? (
            <div className="mt-6 max-w-[440px]">
              <Alert>{error}</Alert>
            </div>
          ) : null}
        </div>

        <ol className="divide-y divide-gray-200">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-5 py-7 first:pt-0 last:pb-0">
              <span className="w-6 shrink-0 text-[22px] font-extrabold leading-tight text-ink">{i + 1}</span>
              <div>
                <h2 className="text-[19px] font-bold leading-snug text-ink">{s.title}</h2>
                <p className="mt-1.5 text-[15.5px] leading-relaxed text-gray-500">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>

      <WizardFooterBar>
        <span />
        <Button size="lg" onClick={() => void start()} loading={creating} disabled={loading}>
          Hemen başla
          <FontAwesomeIcon icon={faArrowRight} className="text-[14px]" aria-hidden />
        </Button>
      </WizardFooterBar>
    </div>
  );
}

export default function NewBoatPage() {
  return (
    <Protected>
      <NewBoatIntro />
    </Protected>
  );
}
