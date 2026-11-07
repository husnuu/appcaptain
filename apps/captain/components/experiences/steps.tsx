"use client";

import {
  CANCELLATION_POLICY_LABELS,
  CancellationPolicyType,
  CustomerInfoFieldType,
  CUSTOMER_INFO_FIELD_TYPE_LABELS,
  EXPERIENCE_CATEGORY_LABELS,
  EXPERIENCE_DIFFICULTY_LEVEL_LABELS,
  EXPERIENCE_PRICING_TYPE_LABELS,
  EXPERIENCE_PRODUCT_TYPE_LABELS,
  ExperienceCategory,
  ExperienceDTO,
  ExperienceDifficultyLevel,
  ExperiencePricingType,
  ExperienceProductType,
  ExperienceStep,
  ValidationFieldError,
} from "@getyourboat/shared";
import { Button, cn, FontAwesomeIcon, faTrash, faXmark, LocationPicker } from "@getyourboat/ui";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, uploadToStorage } from "../../lib/api";
import { Checkbox, Field, Input, Label, Select, Textarea } from "../ui";
import { ChipInput } from "./ChipInput";
import { LinesField, StepShell } from "./form-utils";
import { ChoiceTiles, SectionTitle, ToggleTile, UploadDropzone } from "../wizard/focus";

const INCLUDED_SUGGESTIONS = ["Kaptan", "Yakıt", "Ekipman", "Sigorta", "Atıştırmalık", "Su"];
const EXCLUDED_SUGGESTIONS = ["Ulaşım", "Öğle yemeği", "Kişisel harcamalar", "Bahşiş"];
const TO_BRING_SUGGESTIONS = ["Güneş kremi", "Havlu", "Yüzme kıyafeti", "Fotoğraf makinesi"];
const NOT_ALLOWED_SUGGESTIONS = ["Evcil hayvan", "Cam şişe", "Sigara (iç mekanda)", "Alkol"];

const MIN_AGE_OPTIONS = ["", "0", "6", "8", "10", "12", "16", "18"];

const TICKET_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "" as const, label: "Belirtilmedi" },
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
  const [secondaryCategories, setSecondaryCategories] = useState<ExperienceCategory[]>(
    experience.secondaryCategories
  );
  const [productType, setProductType] = useState(experience.productType ?? "");
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.CATEGORY);

  function toggleSecondary(key: ExperienceCategory) {
    setSecondaryCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  }

  return (
    <StepShell
      title="Kategori"
      description="Deneyiminin türünü seç."
      error={error}
      fieldErrors={fieldErrors}
      footer={
        <Button size="lg"
          onClick={() =>
            void save(
              experience.id,
              { category, secondaryCategories, productType: productType || null },
              (next) => { onSaved(next); onNext(); }
            )
          }
          disabled={saving}
        >
          {saving ? "Kaydediliyor…" : "Kaydet ve ilerle"}
        </Button>
      }
    >
      <section>
        <SectionTitle>
          Kategori <span className="text-danger-500">*</span>
        </SectionTitle>
        <ChoiceTiles<ExperienceCategory>
          ariaLabel="Kategori"
          value={category}
          onChange={setCategory}
          options={Object.entries(EXPERIENCE_CATEGORY_LABELS).map(([key, label]) => ({
            value: key as ExperienceCategory,
            label,
          }))}
        />
      </section>
      <section>
        <SectionTitle
          optional
          hint="Vitrindeki ek kategori sayfalarında da listelenmesini istiyorsan seç."
        >
          İkincil kategoriler
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(EXPERIENCE_CATEGORY_LABELS)
            .filter(([key]) => key !== category)
            .map(([key, label]) => (
              <ToggleTile
                key={key}
                on={secondaryCategories.includes(key as ExperienceCategory)}
                onToggle={() => toggleSecondary(key as ExperienceCategory)}
                label={label}
              />
            ))}
        </div>
      </section>
      <section>
        <SectionTitle>Program tipi</SectionTitle>
        <ChoiceTiles<ExperienceProductType | "">
          ariaLabel="Program tipi"
          value={productType as ExperienceProductType | ""}
          onChange={(v) => setProductType(v)}
          options={[
            { value: "" as const, label: "Belirtilmedi" },
            ...Object.entries(EXPERIENCE_PRODUCT_TYPE_LABELS).map(([key, label]) => ({
              value: key as ExperienceProductType,
              label,
            })),
          ]}
        />
      </section>
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
    if (!isValid) {
      // Butonu alttaki çubukta; ilk hatalı alanı görünür yap.
      requestAnimationFrame(() =>
        document
          .querySelector('[aria-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      );
      return;
    }
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
      footer={
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          aria-disabled={!isValid}
          className={cn(
            "inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-semibold transition-all disabled:opacity-60",
            isValid
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "cursor-not-allowed bg-gray-200 text-gray-400"
          )}
        >
          {saving ? "Kaydediliyor…" : "Kaydet ve ilerle"}
        </button>
      }
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
  const [difficultyLevel, setDifficultyLevel] = useState(experience.difficultyLevel ?? "");
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.INCLUDED_INFO);

  return (
    <StepShell title="Dahil / Hariç / Bilgilendirme" error={error} fieldErrors={fieldErrors}
      footer={
        <Button size="lg"
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
                difficultyLevel: difficultyLevel || null,
              },
              (next) => { onSaved(next); onNext(); }
            )
          }
          disabled={saving}
        >
          {saving ? "Kaydediliyor…" : "Kaydet ve ilerle"}
        </Button>
      }
    >
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
      <section>
        <SectionTitle>Zorluk seviyesi</SectionTitle>
        <ChoiceTiles<ExperienceDifficultyLevel | "">
          ariaLabel="Zorluk seviyesi"
          value={difficultyLevel as ExperienceDifficultyLevel | ""}
          onChange={(v) => setDifficultyLevel(v)}
          options={[
            { value: "" as const, label: "Belirtilmedi" },
            ...Object.entries(EXPERIENCE_DIFFICULTY_LEVEL_LABELS).map(([key, label]) => ({
              value: key as ExperienceDifficultyLevel,
              label,
            })),
          ]}
        />
      </section>
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
  const [pickupOffered, setPickupOffered] = useState(experience.pickupOffered);
  const [pickupAreas, setPickupAreas] = useState(experience.pickupAreas ?? "");
  const [pickupFee, setPickupFee] = useState(
    experience.pickupFee != null ? String(experience.pickupFee) : ""
  );
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.LOGISTICS);

  const [knownLocations, setKnownLocations] = useState<string[]>([]);
  useEffect(() => {
    api.getLocationSuggestions().then(setKnownLocations).catch(() => {});
  }, []);

  function toggleAccessibility(option: string) {
    setAccessibilityOptions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  return (
    <StepShell title="Lojistik" error={error} fieldErrors={fieldErrors}
      footer={
        <Button size="lg"
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
                pickupOffered,
                pickupAreas: pickupAreas || null,
                pickupFee: pickupFee ? Number(pickupFee) : null,
              },
              (next) => { onSaved(next); onNext(); }
            )
          }
          disabled={saving}
        >
          {saving ? "Kaydediliyor…" : "Kaydet ve ilerle"}
        </Button>
      }
    >
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
          knownLocations={knownLocations}
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
      <Field>
        <Checkbox
          checked={pickupOffered}
          onChange={(e) => setPickupOffered(e.target.checked)}
          label="Otelden alış (pickup) hizmeti sunuyorum"
        />
      </Field>
      {pickupOffered ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label>Hizmet bölgeleri / oteller</Label>
            <Textarea
              rows={2}
              value={pickupAreas}
              onChange={(e) => setPickupAreas(e.target.value)}
              placeholder="Örn. Bodrum merkez otelleri, Gümbet…"
            />
          </Field>
          <Field>
            <Label>Ek ücret (varsa)</Label>
            <Input type="number" min="0" step="0.01" value={pickupFee} onChange={(e) => setPickupFee(e.target.value)} />
          </Field>
        </div>
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
      <section>
        <SectionTitle>Erişilebilirlik seçenekleri</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACCESSIBILITY_OPTIONS.map((option) => (
            <ToggleTile
              key={option}
              on={accessibilityOptions.includes(option)}
              onToggle={() => toggleAccessibility(option)}
              label={option}
            />
          ))}
        </div>
      </section>
      <Field>
        <Label>Ek erişilebilirlik notu</Label>
        <Textarea rows={3} value={accessibilityInfo} onChange={(e) => setAccessibilityInfo(e.target.value)} />
      </Field>
      <CustomerInfoFieldBuilder experience={experience} onSaved={onSaved} />
    </StepShell>
  );
}

function CustomerInfoFieldBuilder({
  experience,
  onSaved,
}: {
  experience: ExperienceDTO;
  onSaved: (next: ExperienceDTO) => void;
}) {
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<CustomerInfoFieldType>(CustomerInfoFieldType.TEXT);
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (label.trim().length < 2) {
      setError("Alan adı en az 2 karakter olmalı");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { items } = await api.addExperienceCustomerInfoField(experience.id, {
        label: label.trim(),
        fieldType,
        required,
        options:
          fieldType === CustomerInfoFieldType.DROPDOWN
            ? options.split(",").map((o) => o.trim()).filter(Boolean)
            : [],
      });
      onSaved({ ...experience, customerInfoFields: items });
      setLabel("");
      setOptions("");
      setRequired(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Alan eklenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(fieldId: string) {
    setRemovingId(fieldId);
    setError(null);
    try {
      const { items } = await api.removeExperienceCustomerInfoField(experience.id, fieldId);
      onSaved({ ...experience, customerInfoFields: items });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Alan silinemedi");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Field>
      <Label>Müşteriden istenecek ek bilgiler</Label>
      <p className="mb-2 text-xs text-gray-500">
        Rezervasyon sırasında müşteriden istenecek özel alanlar (ör. pasaport no, diyet kısıtlaması).
      </p>
      {experience.customerInfoFields.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {experience.customerInfoFields.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <span>
                {f.label}{" "}
                <span className="text-xs text-gray-400">
                  ({CUSTOMER_INFO_FIELD_TYPE_LABELS[f.fieldType]}
                  {f.required ? ", zorunlu" : ""})
                </span>
              </span>
              <button
                type="button"
                disabled={removingId === f.id}
                onClick={() => void handleRemove(f.id)}
                className="text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrash} className="text-[13px]" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Alan adı (ör. Pasaport No)" />
        <Select value={fieldType} onChange={(e) => setFieldType(e.target.value as CustomerInfoFieldType)}>
          {Object.entries(CUSTOMER_INFO_FIELD_TYPE_LABELS).map(([key, l]) => (
            <option key={key} value={key}>
              {l}
            </option>
          ))}
        </Select>
      </div>
      {fieldType === CustomerInfoFieldType.DROPDOWN ? (
        <Input
          className="mt-2"
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          placeholder="Seçenekler (virgülle ayır)"
        />
      ) : null}
      <div className="mt-2 flex items-center justify-between">
        <Checkbox checked={required} onChange={(e) => setRequired(e.target.checked)} label="Zorunlu alan" />
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleAdd()}
          className="rounded-full border-2 border-brand-500 px-4 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-500 hover:text-white disabled:opacity-50"
        >
          {busy ? "Ekleniyor…" : "Alan Ekle"}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-danger-600">{error}</p> : null}
    </Field>
  );
}

export function PricingStep({ experience, onSaved, onNext }: ExperienceStepProps) {
  const [basePrice, setBasePrice] = useState(String(experience.basePrice || ""));
  const [currency, setCurrency] = useState(experience.currency || "EUR");
  const [pricingType, setPricingType] = useState(experience.pricingType);
  const [childDiscountPercent, setChildDiscountPercent] = useState(
    experience.childDiscountPercent != null ? String(experience.childDiscountPercent) : ""
  );
  const [currencyLocked, setCurrencyLocked] = useState(experience.currencyLocked);
  const [displayCurrency, setDisplayCurrency] = useState(experience.displayCurrency ?? "");
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.PRICING);

  return (
    <StepShell title="Fiyatlandırma" error={error} fieldErrors={fieldErrors}
      footer={
        <Button size="lg"
          onClick={() =>
            void save(
              experience.id,
              {
                basePrice: Number(basePrice),
                currency,
                pricingType,
                childDiscountPercent: childDiscountPercent ? Number(childDiscountPercent) : null,
                currencyLocked,
                displayCurrency: displayCurrency || null,
              },
              (next) => { onSaved(next); onNext(); }
            )
          }
          disabled={saving}
        >
          {saving ? "Kaydediliyor…" : "Kaydet ve ilerle"}
        </Button>
      }
    >
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
      <section>
        <SectionTitle>
          Fiyatlandırma tipi <span className="text-danger-500">*</span>
        </SectionTitle>
        <ChoiceTiles<ExperiencePricingType>
          columns={2}
          ariaLabel="Fiyatlandırma tipi"
          value={pricingType}
          onChange={setPricingType}
          options={Object.entries(EXPERIENCE_PRICING_TYPE_LABELS).map(([key, label]) => ({
            value: key as ExperiencePricingType,
            label,
          }))}
        />
      </section>
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
      <Field>
        <Checkbox
          checked={currencyLocked}
          onChange={(e) => setCurrencyLocked(e.target.checked)}
          label="Zorunlu para birimi (müşteri görüntüleme para birimini değiştiremez)"
        />
      </Field>
      <Field>
        <Label>Alternatif gösterim para birimi</Label>
        <p className="mb-2 text-xs text-gray-500">
          Opsiyonel — seçilirse fiyatın yanında parantez içinde bu para biriminde de gösterilir. Satışı etkilemez.
        </p>
        <Input
          value={displayCurrency}
          onChange={(e) => setDisplayCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          placeholder="Örn. EUR"
        />
      </Field>
      <SeasonalPricingBuilder experience={experience} onSaved={onSaved} />
    </StepShell>
  );
}

function SeasonalPricingBuilder({
  experience,
  onSaved,
}: {
  experience: ExperienceDTO;
  onSaved: (next: ExperienceDTO) => void;
}) {
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!startDate || !endDate || !price) {
      setError("Tarih aralığı ve fiyat gerekli");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { items } = await api.addExperienceSeasonalPricingRule(experience.id, {
        label: label.trim() || undefined,
        startDate,
        endDate,
        price: Number(price),
      });
      onSaved({ ...experience, seasonalPricingRules: items });
      setLabel("");
      setStartDate("");
      setEndDate("");
      setPrice("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kural eklenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(ruleId: string) {
    setRemovingId(ruleId);
    setError(null);
    try {
      const { items } = await api.removeExperienceSeasonalPricingRule(experience.id, ruleId);
      onSaved({ ...experience, seasonalPricingRules: items });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kural silinemedi");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Field>
      <Label>Sezonluk fiyat kuralları</Label>
      <p className="mb-2 text-xs text-gray-500">
        Belirli tarih aralıkları için farklı bir fiyat tanımla (ör. yüksek sezon).
      </p>
      {experience.seasonalPricingRules.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {experience.seasonalPricingRules.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <span>
                {r.label ? `${r.label}: ` : ""}
                {new Date(r.startDate).toLocaleDateString("tr-TR")} –{" "}
                {new Date(r.endDate).toLocaleDateString("tr-TR")} —{" "}
                <span className="font-semibold">{r.price.toLocaleString("tr-TR")}</span>
              </span>
              <button
                type="button"
                disabled={removingId === r.id}
                onClick={() => void handleRemove(r.id)}
                className="text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrash} className="text-[13px]" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Etiket (ör. Yüksek Sezon)" />
        <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Fiyat" />
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleAdd()}
        className="mt-2 rounded-full border-2 border-brand-500 px-4 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-500 hover:text-white disabled:opacity-50"
      >
        {busy ? "Ekleniyor…" : "Kural Ekle"}
      </button>
      {error ? <p className="mt-1 text-xs text-danger-600">{error}</p> : null}
    </Field>
  );
}

export function CancellationStep({ experience, onSaved, onNext }: ExperienceStepProps) {
  const [cancellationPolicy, setCancellationPolicy] = useState(experience.cancellationPolicy);
  const [cancellationPolicyText, setCancellationPolicyText] = useState(
    experience.cancellationPolicyText ?? ""
  );
  const [tiers, setTiers] = useState(experience.cancellationTiers);
  const { saving, error, fieldErrors, save } = useStepSave(ExperienceStep.CANCELLATION);

  function addTier() {
    setTiers((prev) => [...prev, { daysBefore: 7, refundPercent: 50 }]);
  }

  function updateTier(index: number, patch: Partial<{ daysBefore: number; refundPercent: number }>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <StepShell
      title="İptal Politikası"
      description="Tam açıklamadaki iptal koşulları bu seçimle çelişmemeli."
      error={error}
      fieldErrors={fieldErrors}
      footer={
        <Button size="lg"
          onClick={() =>
            void save(
              experience.id,
              {
                cancellationPolicy,
                cancellationPolicyText:
                  cancellationPolicy === CancellationPolicyType.CUSTOM
                    ? cancellationPolicyText
                    : null,
                cancellationTiers: tiers,
              },
              (next) => { onSaved(next); onNext(); }
            )
          }
          disabled={saving}
        >
          {saving ? "Kaydediliyor…" : "Kaydet ve ilerle"}
        </Button>
      }
    >
      <section>
        <SectionTitle>
          İptal politikası <span className="text-danger-500">*</span>
        </SectionTitle>
        <ChoiceTiles<CancellationPolicyType>
          columns={2}
          ariaLabel="İptal politikası"
          value={cancellationPolicy}
          onChange={setCancellationPolicy}
          options={Object.entries(CANCELLATION_POLICY_LABELS).map(([key, label]) => ({
            value: key as CancellationPolicyType,
            label,
          }))}
        />
      </section>
      {cancellationPolicy === CancellationPolicyType.CUSTOM ? (
        <Field>
          <Label>Özel iptal metni *</Label>
          <Textarea rows={4} value={cancellationPolicyText} onChange={(e) => setCancellationPolicyText(e.target.value)} />
        </Field>
      ) : null}
      <Field>
        <Label>Zaman dilimli iptal kesinti tablosu</Label>
        <p className="mb-2 text-xs text-gray-500">
          “Tur tarihinden X gün öncesine kadar %Y iade” şeklinde birden fazla kademe ekleyebilirsin.
        </p>
        {tiers.map((tier, i) => (
          <div key={i} className="mb-2 flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={tier.daysBefore}
              onChange={(e) => updateTier(i, { daysBefore: Number(e.target.value) })}
              className="w-24"
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">gün öncesine kadar %</span>
            <Input
              type="number"
              min="0"
              max="100"
              value={tier.refundPercent}
              onChange={(e) => updateTier(i, { refundPercent: Number(e.target.value) })}
              className="w-20"
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">iade</span>
            <button
              type="button"
              onClick={() => removeTier(i)}
              className="ml-auto text-gray-400 transition-colors hover:text-red-500"
            >
              <FontAwesomeIcon icon={faTrash} className="text-[13px]" aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addTier}
          className="rounded-full border-2 border-brand-500 px-4 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-500 hover:text-white"
        >
          Kademe Ekle
        </button>
      </Field>
    </StepShell>
  );
}

export function MediaStep({ experience, onSaved }: ExperienceStepProps) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState(experience.videoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
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

  async function handleRemovePhoto(url: string) {
    setRemovingUrl(url);
    setError(null);
    try {
      const next = await api.deleteExperiencePhoto(experience.id, url);
      onSaved(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fotoğraf silinemedi");
    } finally {
      setRemovingUrl(null);
    }
  }

  function handleSubmitForReview() {
    void save(
      experience.id,
      {
        coverPhotoUrl: experience.coverPhotoUrl,
        photoUrls: experience.photoUrls,
        videoUrl: videoUrl || null,
      },
      async (next) => {
        onSaved(next);
        setSubmitting(true);
        setError(null);
        try {
          const submitted = await api.submitExperience(experience.id);
          onSaved(submitted);
          router.push("/experiences");
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "İncelemeye gönderilemedi");
        } finally {
          setSubmitting(false);
        }
      }
    );
  }

  return (
    <StepShell
      title="Medya"
      description="Kapak fotoğrafı zorunlu. Galeri için en az 5 foto önerilir."
      error={error || saveError}
      fieldErrors={fieldErrors}
      footer={
        <Button size="lg"
          onClick={handleSubmitForReview}
          disabled={saving || submitting || !experience.coverPhotoUrl}
        >
          {saving ? "Kaydediliyor…" : submitting ? "Gönderiliyor…" : "İncelemeye Gönder"}
        </Button>
      }
    >
      <section>
        <SectionTitle hint="Deneyimin vitrinde bu fotoğrafla görünür.">
          Kapak fotoğrafı <span className="text-danger-500">*</span>
        </SectionTitle>
        {experience.coverPhotoUrl ? (
          <figure className="relative mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
            {/* Supabase'den gelen uzak URL; next/image için domain yapılandırması gerektirmesin diye <img>. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={experience.coverPhotoUrl} alt="Kapak" className="aspect-[16/9] w-full object-cover" />
            <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-[12.5px] font-semibold text-brand-600 shadow-sm">
              Kapak fotoğrafı
            </span>
            <button
              type="button"
              aria-label="Kapak fotoğrafını sil"
              disabled={removingUrl === experience.coverPhotoUrl}
              onClick={() => void handleRemovePhoto(experience.coverPhotoUrl)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition-colors hover:bg-danger-600 hover:text-white disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faXmark} className="text-[14px]" aria-hidden />
            </button>
          </figure>
        ) : null}
        <UploadDropzone
          accept="image/*"
          compact={!!experience.coverPhotoUrl}
          busy={uploading}
          title={experience.coverPhotoUrl ? "Kapak fotoğrafını değiştir" : "Kapak fotoğrafını buraya sürükle"}
          hint={experience.coverPhotoUrl ? undefined : "Ya da bilgisayarından seç. Yatay ve aydınlık bir fotoğraf en iyi sonucu verir."}
          buttonLabel="Fotoğraf seç"
          onFiles={(files) => {
            const file = files[0];
            if (file) void handleUpload(file, true);
          }}
        />
      </section>

      <section className="border-t border-gray-200 pt-8">
        <SectionTitle hint="Galeri için en az 5 fotoğraf önerilir.">Galeri</SectionTitle>
        {experience.photoUrls.length > 0 ? (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {experience.photoUrls.map((url) => (
              <figure key={url} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                <button
                  type="button"
                  aria-label="Fotoğrafı sil"
                  disabled={removingUrl === url}
                  onClick={() => void handleRemovePhoto(url)}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition-colors hover:bg-danger-600 hover:text-white disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-[12px]" aria-hidden />
                </button>
              </figure>
            ))}
          </div>
        ) : null}
        <UploadDropzone
          accept="image/*"
          multiple
          compact
          busy={uploading}
          title="Galeriye fotoğraf ekle"
          hint="Birden fazla fotoğrafı aynı anda seçebilirsin."
          buttonLabel="Fotoğraf seç"
          onFiles={async (files) => {
            for (const file of files) {
              await handleUpload(file, false);
            }
          }}
        />
      </section>

      <Field>
        <Label>Video URL (opsiyonel)</Label>
        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
      </Field>

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
