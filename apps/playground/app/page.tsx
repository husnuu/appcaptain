"use client";

import { useCallback, useEffect, useState } from "react";
import type { OnboardingConfigDTO } from "@getyourboat/shared";
import { Alert, Badge, Button, Card, CardContent, Spinner } from "@getyourboat/ui";
import { API_BASE, api } from "../lib/api";

export default function Home() {
  const [config, setConfig] = useState<OnboardingConfigDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setConfig(await api.getConfig());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-display text-ink">
          GetYourBoat <span className="text-brand-500">Playground</span>
        </h1>
        <p className="mt-2 text-body text-gray-600">
          Ayrı katman frontend. Veri tek yoldan geliyor:{" "}
          <strong className="text-gray-900">
            API client → API → service → repository → DB
          </strong>
          .
        </p>
        <code className="mt-2 block text-caption text-gray-500">
          GET {API_BASE}/onboarding/config
        </code>
        <div className="mt-4">
          <Button size="sm" onClick={load} loading={loading}>
            Yeniden yükle
          </Button>
        </div>
      </header>

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-10 text-gray-600">
            <Spinner /> Yükleniyor…
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="danger">
          <strong>API&apos;ye ulaşılamadı:</strong> {error}
          <div className="mt-1 text-caption">
            API çalışıyor mu? <code>pnpm --filter @getyourboat/api dev</code>
          </div>
        </Alert>
      ) : config ? (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Tekne Tipi" value={config.boatTypes.length} />
            <Stat label="Kiralama Modeli" value={config.listingModels.length} />
            <Stat label="Özellik Grubu" value={config.featureGroups.length} />
            <Stat label="Donanım Kat." value={config.amenityCategories.length} />
            <Stat label="Belge Tipi" value={config.documentTypes.length} />
          </div>

          <Section title="Tekne Tipleri">
            {config.boatTypes.map((t) => (
              <Badge key={t.id} variant="brand">
                {t.label}
              </Badge>
            ))}
          </Section>

          <Section title="Donanım Kategorileri">
            {config.amenityCategories.map((c) => (
              <Badge key={c.id} variant="neutral">
                {c.label} ({c.amenities.length})
              </Badge>
            ))}
          </Section>

          <Section title="Belge Tipleri">
            {config.documentTypes.map((d) => (
              <Badge key={d.id} variant={d.required ? "warning" : "neutral"}>
                {d.label}
                {d.required ? " • zorunlu" : ""}
              </Badge>
            ))}
          </Section>
        </div>
      ) : null}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-4">
        <div className="text-display leading-none text-ink">{value}</div>
        <div className="mt-1 text-caption text-gray-500">{label}</div>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <h2 className="mb-3 text-subheading text-ink">{title}</h2>
        <div className="flex flex-wrap gap-2">{children}</div>
      </CardContent>
    </Card>
  );
}
