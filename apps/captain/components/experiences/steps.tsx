"use client";

import {
  CANCELLATION_POLICY_LABELS,
  CancellationPolicyType,
  EXPERIENCE_CATEGORY_LABELS,
  EXPERIENCE_PRICING_TYPE_LABELS,
  ExperienceCategory,
  ExperienceDTO,
  ExperiencePricingType,
  ExperienceStep,
  ValidationFieldError,
} from "@getyourboat/shared";
import { Button, cn, LocationPicker } from "@getyourboat/ui";
import { useState } from "react";
import { api, ApiError, uploadToStorage } from "../../lib/api";
import { Alert, Checkbox, Field, Input, Label, Select, Textarea } from "../ui";
import { ChipInput } from "./ChipInput";
import { LinesField, StepShell } from "./form-utils";

const INCLUDED_SUGGESTIONS = ["Kaptan", "Yakıt", "Ekipman", "Sigorta", "Atıştırmalık", "Su"];
const EXCLUDED_SUGGESTIONS = ["Ulaşım", "Öğle yemeği", "Kişisel harcamalar", "Bahşiş"];
const TO_BRING_SUGGESTIONS = ["Güneş kremi", "Havlu", "Yüzme kıyafeti", "Fotoğraf makinesi"];
const NOT_ALLOWED_SUGGESTIONS = ["Evcil hayvan", "Cam şişe", "Sigara (iç mekanda)", "Alkol"];

const MIN_AGE_OPTIONS = ["", "0", "6", "8", "10", "12", "16", "18"];

const TICKET_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Belirtilmedi" },
  { value: "mobile", label: "Mobil bilet" },
  { value: "printed", label: "Baskılı bilet" },
  { value: "both", label: "Her ikisi de" },
];

const ACCESSIBILITY_OPTIONS = [
  "Tekerlekli sandalye erişimi",
  "İşitme engelli uyumlu",
  "Görme engelli uyumlu",
  "Bebek arabası uygun",
  "Yaşlı/hareket kısıtlı uyumlu",
];

export interface ExperienceStepProps {
  experience: ExperienceDTO;
  onSaved: (next: ExperienceDTO) => void;
  onNext: () => void;
}

function useStepSave(step: ExperienceStep) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationFieldError[]>([]);

  async function save(id: string, body: unknown, onSaved: (next: ExperienceDTO) => void) {
    setSaving(true);
    setError(null);
    setFieldErrors([]);
    try {
      const next = await api.updateExperienceStep(id, step, body);
      onSaved(next);
    } catch (err) {
      if (err instanceof ApiError && err.fields && err.fields.length > 0) {
        setFieldErrors(err.fields);
      } else {
        setError(err instanceof ApiError ? err.message : "Kaydedilemedi");
      }
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, fieldErrors, save };
}

export function CategoryStep({ experience, onSaved, onNext }: ExperienceStepProps) {
  const [category, setCategory] = useState(experience.category ?? ExperienceCategory.BOAT_TOUR);
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.CATEGORY);

  return (
    <StepShell
      title="Kategori"
      description="Deneyiminin türünü seç."
      error={error}
      fieldErrors={fieldErrors}
    >
      <Field>
        <Label>Kategori *</Label>
        <Select value={category} onChange={(e) => setCategory(e.target.value as ExperienceCategory)}>
          {Object.entries(EXPERIENCE_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Button
        onClick={() => void save(experience.id, { category }, (next) => { onSaved(next); onNext(); })}
        disabled={saving}
      >
        {saving ? "Kaydediliyor…" : "Devam et"}
      </Button>
    </StepShell>
  );
}

export function TitleDescriptionStep({ experience, onSaved, onNext }: ExperienceStepProps) {
  const [title, setTitle] = useState(experience.title);
  const [referenceCode, setReferenceCode] = useState(experience.referenceCode ?? "");
  const [shortDescription, setShortDescription] = useState(experience.shortDescription);
  const [fullDescription, setFullDescription] = useState(experience.fullDescription);
  const [highlights, setHighlights] = useState(experience.highlights);
  const [keywords, setKeywords] = useState(experience.keywords);
  const [attempted, setAttempted] = useState(false);
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.TITLE_DESCRIPTION);

  const titleLen = title.trim().length;
  const shortLen = shortDescription.trim().length;
  const fullLen = fullDescription.trim().length;

  // Client-side validation mirrors the server Zod schema so we never POST
  // invalid data (which previously produced an opaque 400).
  const localErrors: Record<string, string> = {};
  if (titleLen < 10) localErrors.title = `En az 10 karakter gerekli (şu an: ${titleLen})`;
  else if (titleLen > 120) localErrors.title = "En fazla 120 karakter girilebilir";
  if (shortLen < 20)
    localErrors.shortDescription = `En az 20 karakter gerekli (şu an: ${shortLen})`;
  else if (shortLen > 300)
    localErrors.shortDescription = "En fazla 300 karakter girilebilir";
  if (fullLen < 100)
    localErrors.fullDescription = `En az 100 karakter gerekli (şu an: ${fullLen})`;
  if (highlights.length === 0)
    localErrors.highlights = "En az bir öne çıkan madde ekleyin";

  const isValid = Object.keys(localErrors).length === 0;
  const errFor = (key: string) => (attempted ? localErrors[key] : undefined);
  const counterClass = (below: boolean) =>
    cn("mt-1 text-xs", below ? "text-danger-600" : "text-gray-500");

  function handleSubmit() {
    setAttempted(true);
    if (!isValid) return;
    void save(
      experience.id,
      {
        title,
        referenceCode: referenceCode.trim() || null,
        shortDescription,
        fullDescription,
        highlights,
        keywords,
      },
      (next) => {
        onSaved(next);
        onNext();
      }
    );
  }

  return (
    <StepShell
      title="Başlık & Açıklama"
      description="Başlık konum adıyla başlamalı (örn. Bodrum Gün Batımı Yelken Turu)."
      error={error}
      fieldErrors={fieldErrors}
    >
      <Field>
        <Label>Başlık *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          error={!!errFor("title")}
        />
        {errFor("title") ? (
          <p className="mt-1 text-xs text-danger-600">{errFor("title")}</p>
        ) : null}
        <p className={counterClass(titleLen < 10)}>
          {titleLen} / 120{titleLen < 10 ? " (en az 10)" : ""}
        </p>
      </Field>
      <Field>
        <Label>Referans kodu</Label>
        <Input
          value={referenceCode}
          onChange={(e) => setReferenceCode(e.target.value)}
          maxLength={40}
          placeholder="Örn. EXP-1234 (opsiyonel — dahili takip için)"
        />
      </Field>
      <Field>
        <Label>Kısa açıklama *</Label>
        <Textarea
          rows={3}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          error={!!errFor("shortDescription")}
        />
        {errFor("shortDescription") ? (
          <p className="mt-1 text-xs text-danger-600">{errFor("shortDescription")}</p>
        ) : null}
        <p className={counterClass(shortLen < 20)}>
          {shortLen} / 300{shortLen < 20 ? " (en az 20)" : ""}
        </p>
      </Field>
      <Field>
        <Label>Tam açıklama *</Label>
        <Textarea
          rows={6}
          value={fullDescription}
          onChange={(e) => setFullDescription(e.target.value)}
          error={!!errFor("fullDescription")}
        />
        {errFor("fullDescription") ? (
          <p className="mt-1 text-xs text-danger-600">{errFor("fullDescription")}</p>
        ) : null}
        <p className={counterClass(fullLen < 100)}>
          {fullLen} / 5000{fullLen < 100 ? " (en az 100)" : ""}
        </p>
      </Field>
      <div>
        <LinesField
          label="Öne çıkanlar"
          hint="Deneyimini özel kılan 3-5 madde yaz."
          value={highlights}
          onChange={setHighlights}
          required
        />
        {errFor("highlights") ? (
          <p className="mt-1 text-xs text-danger-600">{errFor("highlights")}</p>
        ) : null}
      </div>
      <LinesField
        label="Anahtar kelimeler"
        hint="Müşterilerin seni bulmasına yardımcı etiketler (örn. tekne turu, yelken, Çeşme)."
        value={keywords}
        onChange={setKeywords}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        aria-disabled={!isValid}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition-all disabled:opacity-60",
          isValid
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "cursor-not-allowed bg-gray-200 text-gray-400"
        )}
      >
        {saving ? "Kaydediliyor…" : "Devam et"}
      </button>
    </StepShell>
  );
}

export function IncludedInfoStep({ experience, onSaved, onNext }: ExperienceStepProps) {
  const [included, setIncluded] = useState(experience.included);
  const [notIncluded, setNotIncluded] = useState(experience.notIncluded);
  const [toBring, setToBring] = useState(experience.toBring);
  const [notAllowed, setNotAllowed] = useState(experience.notAllowed);
  const [knowBeforeYouGo, setKnowBeforeYouGo] = useState(experience.knowBeforeYouGo);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    experience.emergencyContactPhone ?? ""
  );
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.INCLUDED_INFO);

  return (
    <StepShell title="Dahil / Hariç / Bilgilendirme" error={error} fieldErrors={fieldErrors}>
      <ChipInput
        label="Fiyata dahil olanlar"
        description="Bilet fiyatına dahil olan her şeyi ekle"
        placeholder="Örn. Kaptan, Yakıt, Sigorta…"
        value={included}
        onChange={setIncluded}
        required
        suggestions={INCLUDED_SUGGESTIONS}
      />
      <ChipInput
        label="Fiyata dahil olmayanlar"
        description="Ayrıca ödenmesi gereken şeyler"
        placeholder="Örn. Ulaşım, Öğle yemeği…"
        value={notIncluded}
        onChange={setNotIncluded}
        suggestions={EXCLUDED_SUGGESTIONS}
      />
      <ChipInput
        label="Getirmeniz gerekenler"
        description="Katılımcıların yanında getirmesi gerekenler"
        placeholder="Örn. Güneş kremi, Havlu…"
        value={toBring}
        onChange={setToBring}
        suggestions={TO_BRING_SUGGESTIONS}
      />
      <ChipInput
        label="İzin verilmeyenler"
        description="Katılımcıların yapmaması gerekenler"
        placeholder="Örn. Evcil hayvan, Cam şişe…"
        value={notAllowed}
        onChange={setNotAllowed}
        suggestions={NOT_ALLOWED_SUGGESTIONS}
      />
      <ChipInput
        label="Gitmeden bilinmesi gerekenler"
        description="Önemli uyarılar ve bilgiler"
        placeholder="Örn. Deniz tutması için ilaç alın…"
        value={knowBeforeYouGo}
        onChange={setKnowBeforeYouGo}
      />
      <Field>
        <Label>Acil durum telefonu</Label>
        <Input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
      </Field>
      <Button
        onClick={() =>
          void save(
            experience.id,
            {
              included,
              notIncluded,
              toBring,
              notAllowed,
              knowBeforeYouGo,
              emergencyContactPhone: emergencyContactPhone || null,
            },
            (next) => { onSaved(next); onNext(); }
          )
        }
        disabled={saving}
      >
        {saving ? "Kaydediliyor…" : "Devam et"}
      </Button>
    </StepShell>
  );
}

export function LogisticsStep({ experience, onSaved, onNext }: ExperienceStepProps) {
  const [durationMinutes, setDurationMinutes] = useState(String(experience.durationMinutes));
  const [meetingPoint, setMeetingPoint] = useState(experience.meetingPoint);
  const [meetingPointLat, setMeetingPointLat] = useState(
    experience.meetingPointLat != null ? String(experience.meetingPointLat) : ""
  );
  const [meetingPointLng, setMeetingPointLng] = useState(
    experience.meetingPointLng != null ? String(experience.meetingPointLng) : ""
  );
  const [meetingTime, setMeetingTime] = useState(experience.meetingTime);
  const [isSameEndPoint, setIsSameEndPoint] = useState(experience.isSameEndPoint);
  const [endPoint, setEndPoint] = useState(experience.endPoint);
  const [languages, setLanguages] = useState(experience.languages.length ? experience.languages : ["Türkçe"]);
  const [minParticipants, setMinParticipants] = useState(String(experience.minParticipants));
  const [maxParticipants, setMaxParticipants] = useState(String(experience.maxParticipants));
  const [minAge, setMinAge] = useState(experience.minAge != null ? String(experience.minAge) : "");
  const [ticketType, setTicketType] = useState(experience.ticketType ?? "");
  const [requiredEquipment, setRequiredEquipment] = useState(experience.requiredEquipment);
  const [accessibilityInfo, setAccessibilityInfo] = useState(experience.accessibilityInfo ?? "");
  const [accessibilityOptions, setAccessibilityOptions] = useState<string[]>(
    experience.accessibilityOptions
  );
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.LOGISTICS);

  function toggleAccessibility(option: string) {
    setAccessibilityOptions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  return (
    <StepShell title="Lojistik" error={error} fieldErrors={fieldErrors}>
      <Field>
        <Label>Süre (dakika) *</Label>
        <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
      </Field>
      <Field>
        <Label>Buluşma noktası *</Label>
        <p className="mb-2 text-xs text-gray-500">
          Haritadan konum ara, tıkla veya işaretçiyi sürükle. Seçtiğin nokta katılımcılara
          gösterilir.
        </p>
        <LocationPicker
          mapboxToken={mapboxToken}
          value={{
            latitude: meetingPointLat ? Number(meetingPointLat) : null,
            longitude: meetingPointLng ? Number(meetingPointLng) : null,
            address: meetingPoint || null,
          }}
          onChange={(next) => {
            setMeetingPointLat(next.latitude != null ? String(next.latitude) : "");
            setMeetingPointLng(next.longitude != null ? String(next.longitude) : "");
            if (next.address != null) setMeetingPoint(next.address);
          }}
        />
        <Input
          value={meetingPoint}
          onChange={(e) => setMeetingPoint(e.target.value)}
          placeholder="Buluşma noktası adı / açıklaması"
          className="mt-2"
        />
      </Field>
      <Field>
        <Label>Buluşma saati *</Label>
        <Input value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} placeholder="örn. 10:00" />
      </Field>
      <Field>
        <Checkbox
          checked={isSameEndPoint}
          onChange={(e) => setIsSameEndPoint(e.target.checked)}
          label="Buluşma ve bitiş noktası aynı"
        />
      </Field>
      {!isSameEndPoint ? (
        <Field>
          <Label>Bitiş noktası</Label>
          <Input
            value={endPoint}
            onChange={(e) => setEndPoint(e.target.value)}
            placeholder="Deneyimin sona erdiği konum"
          />
        </Field>
      ) : null}
      <LinesField label="Diller" value={languages} onChange={setLanguages} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label>Min katılımcı *</Label>
          <Input type="number" value={minParticipants} onChange={(e) => setMinParticipants(e.target.value)} />
        </Field>
        <Field>
          <Label>Maks katılımcı (grup büyüklüğü) *</Label>
          <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label>Minimum yaş</Label>
          <Select value={minAge} onChange={(e) => setMinAge(e.target.value)}>
            {MIN_AGE_OPTIONS.map((age) => (
              <option key={age || "none"} value={age}>
                {age === "" ? "Yaş sınırı yok" : `${age}+`}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label>Bilet türü</Label>
          <Select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
            {TICKET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value || "none"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <LinesField label="Gerekli ekipman / beceriler" value={requiredEquipment} onChange={setRequiredEquipment} />
      <Field>
        <Label>Erişilebilirlik seçenekleri</Label>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {ACCESSIBILITY_OPTIONS.map((option) => (
            <Checkbox
              key={option}
              checked={accessibilityOptions.includes(option)}
              onChange={() => toggleAccessibility(option)}
              label={option}
            />
          ))}
        </div>
      </Field>
      <Field>
        <Label>Ek erişilebilirlik notu</Label>
        <Textarea rows={3} value={accessibilityInfo} onChange={(e) => setAccessibilityInfo(e.target.value)} />
      </Field>
      <Button
        onClick={() =>
          void save(
            experience.id,
            {
              durationMinutes: Number(durationMinutes),
              meetingPoint,
              meetingPointLat: meetingPointLat ? Number(meetingPointLat) : null,
              meetingPointLng: meetingPointLng ? Number(meetingPointLng) : null,
              meetingTime,
              isSameEndPoint,
              endPoint: isSameEndPoint ? "" : endPoint,
              languages,
              minParticipants: Number(minParticipants),
              maxParticipants: Number(maxParticipants),
              minAge: minAge ? Number(minAge) : null,
              ticketType: ticketType || null,
              requiredEquipment,
              accessibilityInfo: accessibilityInfo || null,
              accessibilityOptions,
            },
            (next) => { onSaved(next); onNext(); }
          )
        }
        disabled={saving}
      >
        {saving ? "Kaydediliyor…" : "Devam et"}
      </Button>
    </StepShell>
  );
}

export function PricingStep({ experience, onSaved, onNext }: ExperienceStepProps) {
  const [basePrice, setBasePrice] = useState(String(experience.basePrice || ""));
  const [currency, setCurrency] = useState(experience.currency || "EUR");
  const [pricingType, setPricingType] = useState(experience.pricingType);
  const [childDiscountPercent, setChildDiscountPercent] = useState(
    experience.childDiscountPercent != null ? String(experience.childDiscountPercent) : ""
  );
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.PRICING);

  return (
    <StepShell title="Fiyatlandırma" error={error} fieldErrors={fieldErrors}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label>Temel fiyat *</Label>
          <Input type="number" min="0" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
        </Field>
        <Field>
          <Label>Para birimi *</Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
        </Field>
      </div>
      <Field>
        <Label>Fiyatlandırma tipi *</Label>
        <Select value={pricingType} onChange={(e) => setPricingType(e.target.value as ExperiencePricingType)}>
          {Object.entries(EXPERIENCE_PRICING_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field>
        <Label>Çocuk indirimi (%)</Label>
        <Input
          type="number"
          min="0"
          max="100"
          value={childDiscountPercent}
          onChange={(e) => setChildDiscountPercent(e.target.value)}
        />
      </Field>
      <Button
        onClick={() =>
          void save(
            experience.id,
            {
              basePrice: Number(basePrice),
              currency,
              pricingType,
              childDiscountPercent: childDiscountPercent ? Number(childDiscountPercent) : null,
            },
            (next) => { onSaved(next); onNext(); }
          )
        }
        disabled={saving}
      >
        {saving ? "Kaydediliyor…" : "Devam et"}
      </Button>
    </StepShell>
  );
}

export function CancellationStep({ experience, onSaved, onNext }: ExperienceStepProps) {
  const [cancellationPolicy, setCancellationPolicy] = useState(experience.cancellationPolicy);
  const [cancellationPolicyText, setCancellationPolicyText] = useState(
    experience.cancellationPolicyText ?? ""
  );
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.CANCELLATION);

  return (
    <StepShell
      title="İptal Politikası"
      description="Tam açıklamadaki iptal koşulları bu seçimle çelişmemeli."
      error={error}
      fieldErrors={fieldErrors}
    >
      <Field>
        <Label>İptal politikası *</Label>
        <Select
          value={cancellationPolicy}
          onChange={(e) => setCancellationPolicy(e.target.value as CancellationPolicyType)}
        >
          {Object.entries(CANCELLATION_POLICY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      {cancellationPolicy === CancellationPolicyType.CUSTOM ? (
        <Field>
          <Label>Özel iptal metni *</Label>
          <Textarea rows={4} value={cancellationPolicyText} onChange={(e) => setCancellationPolicyText(e.target.value)} />
        </Field>
      ) : null}
      <Button
        onClick={() =>
          void save(
            experience.id,
            {
              cancellationPolicy,
              cancellationPolicyText:
                cancellationPolicy === CancellationPolicyType.CUSTOM
                  ? cancellationPolicyText
                  : null,
            },
            (next) => { onSaved(next); onNext(); }
          )
        }
        disabled={saving}
      >
        {saving ? "Kaydediliyor…" : "Devam et"}
      </Button>
    </StepShell>
  );
}

export function MediaStep({ experience, onSaved, onNext }: ExperienceStepProps) {
  const [videoUrl, setVideoUrl] = useState(experience.videoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saving, error: saveError, fieldErrors, save } = useStepSave(ExperienceStep.MEDIA);

  async function handleUpload(file: File, asCover?: boolean) {
    setUploading(true);
    setError(null);
    try {
      const upload = await api.experiencePhotoUploadUrl(experience.id, file.name);
      await uploadToStorage(upload, file);
      const next = await api.registerExperiencePhoto(experience.id, {
        storagePath: upload.path,
        asCover,
      });
      onSaved(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fotoğraf yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  return (
    <StepShell
      title="Medya"
      description="Kapak fotoğrafı zorunlu. Galeri için en az 5 foto önerilir."
      error={error || saveError}
      fieldErrors={fieldErrors}
    >
      {experience.coverPhotoUrl ? (
        // Supabase'den gelen uzak URL; next/image için domain yapılandırması gerektirmesin diye <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={experience.coverPhotoUrl} alt="Kapak" className="h-40 w-full rounded-xl object-cover" />
      ) : (
        <Alert variant="info">Kapak fotoğrafı henüz yüklenmedi.</Alert>
      )}

      <Field>
        <Label>Kapak fotoğrafı yükle</Label>
        <Input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file, true);
          }}
        />
      </Field>

      <Field>
        <Label>Galeri fotoğrafı ekle</Label>
        <Input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file, false);
          }}
        />
      </Field>

      {experience.photoUrls.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {experience.photoUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
          ))}
        </div>
      ) : null}

      <Field>
        <Label>Video URL (opsiyonel)</Label>
        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
      </Field>

      <Button
        onClick={() =>
          void save(
            experience.id,
            {
              coverPhotoUrl: experience.coverPhotoUrl,
              photoUrls: experience.photoUrls,
              videoUrl: videoUrl || null,
            },
            (next) => { onSaved(next); onNext(); }
          )
        }
        disabled={saving || !experience.coverPhotoUrl}
      >
        {saving ? "Kaydediliyor…" : "Devam et"}
      </Button>
    </StepShell>
  );
}

export const EXPERIENCE_STEP_COMPONENTS = {
  CATEGORY: CategoryStep,
  TITLE_DESCRIPTION: TitleDescriptionStep,
  INCLUDED_INFO: IncludedInfoStep,
  LOGISTICS: LogisticsStep,
  PRICING: PricingStep,
  CANCELLATION: CancellationStep,
  MEDIA: MediaStep,
} as const;
