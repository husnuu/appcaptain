"use client";

import { Button } from "@getyourboat/ui";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { api, ApiError, uploadToStorage } from "../../lib/api";
import type { OnboardingConfig, SerializedBoat } from "../../lib/types";
import { Alert, Checkbox, Field, Input, Select, Spinner, Textarea } from "../ui";

export interface StepProps {
  boat: SerializedBoat;
  config: OnboardingConfig;
  onSaved: (b: SerializedBoat) => void;
  reload: () => Promise<SerializedBoat>;
  goBack: () => void;
}

function useSaver(onSaved: (b: SerializedBoat) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(fn: () => Promise<SerializedBoat>) {
    setBusy(true);
    setError(null);
    try {
      onSaved(await fn());
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.message}${err.details ? ` — ${JSON.stringify(err.details)}` : ""}`
          : "Kaydedilemedi"
      );
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

function StepShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="space-y-5">{children}</div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        {footer}
      </div>
    </div>
  );
}

function BackButton({ onClick, show }: { onClick: () => void; show: boolean }) {
  if (!show) return <span />;
  return (
    <button
      onClick={onClick}
      className="rounded-md px-3 py-2 text-sm text-slate-500 hover:text-slate-800"
    >
      ← Geri
    </button>
  );
}

/* ----------------------- Step 1: Listing model -------------------- */

export function ListingModelStep({ boat, config, onSaved, goBack }: StepProps) {
  const [selected, setSelected] = useState<string[]>(
    boat.listingModels.map((m) => m.key)
  );
  const [approvalType, setApprovalType] = useState(boat.approvalType);
  const { busy, error, run } = useSaver(onSaved);

  function toggle(key: string) {
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  }

  return (
    <StepShell
      title="Kiralama Modeli"
      description="Bu tekneyi nasıl kiraya vereceksin? Birden fazla seçebilirsin."
      footer={
        <>
          <BackButton onClick={goBack} show={false} />
          <Button
            disabled={busy || selected.length === 0}
            onClick={() =>
              run(() => api.updateListingModel(boat.id, { listingModelKeys: selected, approvalType }))
            }
          >
            {busy ? "Kaydediliyor…" : "Kaydet & Devam"}
          </Button>
        </>
      }
    >
      {error ? <Alert>{error}</Alert> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {config.listingModels.map((m) => (
          <label
            key={m.key}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
              selected.includes(m.key)
                ? "border-brand-500 bg-brand-50"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(m.key)}
              onChange={() => toggle(m.key)}
              className="h-4 w-4 text-brand-600"
            />
            <span className="font-medium text-slate-800">{m.label}</span>
          </label>
        ))}
      </div>
      <Field label="Onay tipi" hint="Anında onay mı, manuel onay mı isteniyor?">
        <Select
          value={approvalType}
          onChange={(e) => setApprovalType(e.target.value as "INSTANT" | "MANUAL")}
        >
          <option value="INSTANT">Anında onay (INSTANT)</option>
          <option value="MANUAL">Manuel onay (MANUAL)</option>
        </Select>
      </Field>
    </StepShell>
  );
}

/* ------------------ Step 2: Boat type & features ------------------ */

export function BoatTypeFeaturesStep({ boat, config, onSaved, goBack }: StepProps) {
  const initialFeatures = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of boat.features) map[f.key] = f.value ?? "";
    return map;
  }, [boat.features]);

  const [boatTypeKey, setBoatTypeKey] = useState(boat.boatType?.key ?? "");
  const [values, setValues] = useState<Record<string, string>>(initialFeatures);
  const { busy, error, run } = useSaver(onSaved);

  function save() {
    const features = Object.entries(values)
      .filter(([, v]) => v.trim() !== "")
      .map(([key, value]) => ({ key, value }));
    return api.updateBoatTypeFeatures(boat.id, { boatTypeKey, features });
  }

  return (
    <StepShell
      title="Tekne Tipi & Özellikler"
      description="Teknenin tipini seç ve teknik özelliklerini doldur."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button disabled={busy || !boatTypeKey} onClick={() => run(save)}>
            {busy ? "Kaydediliyor…" : "Kaydet & Devam"}
          </Button>
        </>
      }
    >
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Tekne tipi">
        <Select value={boatTypeKey} onChange={(e) => setBoatTypeKey(e.target.value)}>
          <option value="">Seçiniz…</option>
          {config.boatTypes.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      {config.featureGroups.map((group) => (
        <div key={group.key} className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{group.label}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.features.map((f) => (
              <Field key={f.key} label={f.label}>
                <Input
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                />
              </Field>
            ))}
          </div>
        </div>
      ))}
    </StepShell>
  );
}

/* ------------------------ Step 3: Amenities ----------------------- */

interface AmenityState {
  included: boolean;
  isExtra: boolean;
  extraPrice: string;
}

export function AmenitiesStep({ boat, config, onSaved, goBack }: StepProps) {
  const initial = useMemo(() => {
    const map: Record<string, AmenityState> = {};
    for (const a of boat.amenities) {
      map[a.key] = {
        included: a.isIncluded,
        isExtra: a.isExtra,
        extraPrice: a.extraPrice != null ? String(a.extraPrice) : "",
      };
    }
    return map;
  }, [boat.amenities]);

  const [state, setState] = useState<Record<string, AmenityState>>(initial);
  const { busy, error, run } = useSaver(onSaved);

  function set(key: string, patch: Partial<AmenityState>) {
    setState((s) => ({
      ...s,
      [key]: { included: false, isExtra: false, extraPrice: "", ...s[key], ...patch },
    }));
  }

  function save() {
    const amenities = Object.entries(state)
      .filter(([, v]) => v.included || v.isExtra)
      .map(([amenityKey, v]) => ({
        amenityKey,
        isIncluded: v.included && !v.isExtra,
        isExtra: v.isExtra,
        extraPrice: v.isExtra ? Number(v.extraPrice || 0) : null,
        currency: v.isExtra ? "EUR" : null,
      }));
    return api.updateAmenities(boat.id, { amenities });
  }

  return (
    <StepShell
      title="Donanımlar"
      description="Teknede bulunan donanımları işaretle. Ekstra ücretli olanları belirtebilirsin (opsiyonel adım)."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button disabled={busy} onClick={() => run(save)}>
            {busy ? "Kaydediliyor…" : "Kaydet & Devam"}
          </Button>
        </>
      }
    >
      {error ? <Alert>{error}</Alert> : null}
      {config.amenityCategories.map((cat) => (
        <div key={cat.key} className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{cat.label}</h3>
          <div className="space-y-2">
            {cat.amenities.map((a) => {
              const st = state[a.key] ?? {
                included: false,
                isExtra: false,
                extraPrice: "",
              };
              return (
                <div key={a.key} className="flex flex-wrap items-center gap-4">
                  <Checkbox
                    label={a.label}
                    checked={st.included || st.isExtra}
                    onChange={(e) =>
                      set(a.key, {
                        included: e.target.checked,
                        isExtra: e.target.checked ? st.isExtra : false,
                      })
                    }
                  />
                  {a.canBeExtra && (st.included || st.isExtra) ? (
                    <>
                      <Checkbox
                        label="Ekstra ücretli"
                        checked={st.isExtra}
                        onChange={(e) => set(a.key, { isExtra: e.target.checked })}
                      />
                      {st.isExtra ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            value={st.extraPrice}
                            onChange={(e) => set(a.key, { extraPrice: e.target.value })}
                            className="h-8 w-24"
                            placeholder="Fiyat"
                          />
                          <span className="text-xs text-slate-500">EUR</span>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </StepShell>
  );
}

/* ------------------- Step 4: Description & rules ------------------ */

export function DescriptionRulesStep({ boat, onSaved, goBack }: StepProps) {
  const [title, setTitle] = useState(boat.title ?? "");
  const [description, setDescription] = useState(boat.description ?? "");
  const [rulesText, setRulesText] = useState(boat.rulesText ?? "");
  const [checkInNotes, setCheckInNotes] = useState(boat.checkInNotes ?? "");
  const [checkOutNotes, setCheckOutNotes] = useState(boat.checkOutNotes ?? "");
  const { busy, error, run } = useSaver(onSaved);

  return (
    <StepShell
      title="Açıklama & Kurallar"
      description="İlan başlığı, açıklama ve tekne kurallarını gir."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button
            disabled={busy || title.trim().length < 3}
            onClick={() =>
              run(() =>
                api.updateDescriptionRules(boat.id, {
                  title: title.trim(),
                  description: description || undefined,
                  rulesText: rulesText || null,
                  checkInNotes: checkInNotes || null,
                  checkOutNotes: checkOutNotes || null,
                })
              )
            }
          >
            {busy ? "Kaydediliyor…" : "Kaydet & Devam"}
          </Button>
        </>
      }
    >
      {error ? <Alert>{error}</Alert> : null}
      <Field label="İlan başlığı" hint="En az 3 karakter">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. Bodrum'da 6 kabinli lüks gulet"
        />
      </Field>
      <Field label="Açıklama">
        <Textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Kurallar">
        <Textarea
          rows={3}
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Check-in notları">
          <Textarea
            rows={2}
            value={checkInNotes}
            onChange={(e) => setCheckInNotes(e.target.value)}
          />
        </Field>
        <Field label="Check-out notları">
          <Textarea
            rows={2}
            value={checkOutNotes}
            onChange={(e) => setCheckOutNotes(e.target.value)}
          />
        </Field>
      </div>
    </StepShell>
  );
}

/* --------------------------- Step 5: Photos ----------------------- */

export function PhotosStep({ boat, reload, goBack }: StepProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const upload = await api.photoUploadUrl(boat.id, file.name);
        await uploadToStorage(upload, file);
        await api.registerPhoto(boat.id, { storagePath: upload.path });
      }
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yükleme başarısız");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(photoId: string) {
    setBusy(true);
    try {
      await api.deletePhoto(boat.id, photoId);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function makeCover(photoId: string) {
    setBusy(true);
    try {
      await api.setCover(boat.id, photoId);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <StepShell
      title="Fotoğraflar"
      description="En az bir fotoğraf yükle. İlk yüklenen otomatik kapak olur, dilersen değiştir."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <span className="text-xs text-slate-500">
            {boat.photos.length} fotoğraf · değişiklikler otomatik kaydedilir
          </span>
        </>
      }
    >
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFiles(e.target.files)}
          className="text-sm"
          disabled={busy}
        />
        {busy ? <Spinner /> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {boat.photos.map((p) => (
          <div
            key={p.id}
            className="group relative overflow-hidden rounded-lg border border-slate-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.publicUrl ?? ""}
              alt={p.altText ?? ""}
              className="h-28 w-full object-cover"
            />
            {p.isCover ? (
              <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Kapak
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 px-2 py-1 opacity-0 transition group-hover:opacity-100">
              {!p.isCover ? (
                <button
                  onClick={() => makeCover(p.id)}
                  className="text-[10px] text-white hover:underline"
                >
                  Kapak yap
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={() => remove(p.id)}
                className="text-[10px] text-red-200 hover:underline"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </StepShell>
  );
}

/* ----------------------- Step 6: Pricing -------------------------- */

export function PricingStep({ boat, onSaved, goBack }: StepProps) {
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const m of boat.listingModels) {
      const existing = boat.pricing.find((p) => p.listingModelKey === m.key);
      map[m.key] = existing ? String(existing.price) : "";
    }
    return map;
  });
  const { busy, error, run } = useSaver(onSaved);

  const models = boat.listingModels;

  function save() {
    const pricing = models
      .map((m) => ({ listingModelKey: m.key, price: Number(prices[m.key] || 0) }))
      .filter((p) => !Number.isNaN(p.price));
    return api.updatePricing(boat.id, { pricing });
  }

  if (models.length === 0) {
    return (
      <StepShell
        title="Fiyatlandırma"
        footer={<BackButton onClick={goBack} show />}
      >
        <Alert variant="info">
          Önce 1. adımda kiralama modeli seçmelisin. Fiyatlar seçilen modellere göre
          girilir.
        </Alert>
      </StepShell>
    );
  }

  return (
    <StepShell
      title="Fiyatlandırma"
      description="Seçtiğin her kiralama modeli için fiyat belirle."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button disabled={busy} onClick={() => run(save)}>
            {busy ? "Kaydediliyor…" : "Kaydet & Devam"}
          </Button>
        </>
      }
    >
      {error ? <Alert>{error}</Alert> : null}
      {models.map((m) => (
        <Field key={m.key} label={m.label}>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={prices[m.key] ?? ""}
              onChange={(e) => setPrices((p) => ({ ...p, [m.key]: e.target.value }))}
              placeholder="0"
              className="max-w-[200px]"
            />
            <span className="text-sm text-slate-500">EUR</span>
          </div>
        </Field>
      ))}
    </StepShell>
  );
}

/* --------------------------- Step 7: Documents -------------------- */

export function DocumentsStep({ boat, config, reload, goBack }: StepProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(documentTypeKey: string, file: File) {
    setBusyKey(documentTypeKey);
    setError(null);
    try {
      const up = await api.documentUploadUrl(boat.id, documentTypeKey, file.name);
      await uploadToStorage(up, file);
      await api.registerDocument(boat.id, { documentTypeKey, storagePath: up.path });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Belge yüklenemedi");
    } finally {
      setBusyKey(null);
    }
  }

  async function remove(documentId: string) {
    setBusyKey(documentId);
    try {
      await api.deleteDocument(boat.id, documentId);
      await reload();
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <StepShell
      title="Belgeler"
      description="Gerekli belgeleri yükle. Yöneticiler bu belgeleri inceleyecek."
      footer={<BackButton onClick={goBack} show />}
    >
      {error ? <Alert>{error}</Alert> : null}
      {config.documentTypes.map((dt) => {
        const docs = boat.documents.filter((d) => d.documentTypeKey === dt.key);
        return (
          <div key={dt.key} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                {dt.label}
                {dt.required ? <span className="text-red-500"> *</span> : null}
              </h3>
              {busyKey === dt.key ? <Spinner /> : null}
            </div>
            {docs.length > 0 ? (
              <ul className="mb-2 space-y-1">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-sm"
                  >
                    <span className="text-slate-700">
                      {d.publicUrl ? (
                        <a
                          href={d.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          Yüklenen belge
                        </a>
                      ) : (
                        "Yüklenen belge"
                      )}{" "}
                      · {d.status}
                    </span>
                    <button
                      onClick={() => remove(d.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Sil
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <input
              type="file"
              className="text-sm"
              disabled={busyKey === dt.key}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(dt.key, f);
                e.target.value = "";
              }}
            />
          </div>
        );
      })}
    </StepShell>
  );
}
