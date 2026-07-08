"use client";

import {
  Banner,
  BoatDetailView,
  Button,
  cn,
  FontAwesomeIcon,
  faAnchor,
  faArrowLeft,
  faArrowRight,
  faCalendarDays,
  faCheck,
  faClock,
  faEye,
  faLock,
  faMoon,
  faSun,
  faTriangleExclamation,
  LocationPicker,
  type IconDefinition,
} from "@getyourboat/ui";
import {
  FEATURE_SUB_TABS,
  ENGINE_TYPE_LABELS,
  EngineType,
  buildBoatTypeFeaturesSchema,
  buildAmenitiesSchema,
  buildDescriptionRulesSchema,
  buildFeatureWritesFromValues,
  buildPricingSchema,
  buildValidationErrorResponse,
  BOOLEAN_BOOKING_FIELD_KEYS,
  filterFeatureGroupsBySubTab,
  getFieldLabel,
  getListingModelPriceLabel,
  describeListingModelPackages,
  LISTING_MODEL_BRIEFS,
  amenityCategoryAllowsExtra,
  getRequiredAmenityKeys,
  getRequiredDescriptionFieldKeys,
  getRequiredFeatureKeysForStep,
  getRequiredPricingFieldKeys,
  getInvalidCheckTimeGroupTitles,
  isGuletBoatType,
  OnboardingStep,
  PRICING_REQUIRED_HINT,
  readFieldValues,
  toBoatDetailViewModel,
  LOCATION_FIELD_KEYS,
  LOCATION_FORM_FIELD_KEYS,
  type FeatureSubTabId,
  type FieldValueMap,
} from "@getyourboat/shared";
import { Tabs } from "@getyourboat/ui";
import { useMemo, useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, ApiError, uploadToStorage } from "../../lib/api";
import {
  featureFieldSubTab,
  firstSubTabWithErrors,
  useStepSaver,
} from "../../lib/validation-errors";
import { useStepDraftAutosave } from "../../lib/hooks/useAutosaveDraft";
import { prefetchBrandCatalog } from "../../lib/brand-catalog";
import type { OnboardingConfig, ResolvedOnboardingConfig, SerializedBoat } from "../../lib/types";
import { Alert, Checkbox, Field, Input, Modal, Select, Spinner, Textarea } from "../ui";
import {
  DynamicOnboardingFields,
  FeatureFieldsGrid,
  CrewFieldsSection,
  SPECS_NUMERIC_HINT,
  CABINS_REQUIRED_HINT,
  getConfigFieldsForStep,
  isExtraServicePricingField,
  isResolvedConfig,
} from "./field-renderer";
import {
  BrandModelFields,
  type BrandModelPendingRequest,
} from "./BrandModelFields";
import {
  CabinConfigurationSection,
  toCabinInputs,
} from "./CabinConfigurationSection";
import { StepValidationAlert } from "./step-validation-alert";
import type { CabinConfigurationInput } from "@getyourboat/shared";

/** Picks a context icon for a listing model from its label/key. */
function listingModelIcon(labelOrKey: string): IconDefinition {
  const s = labelOrKey.toLowerCase();
  if (s.includes("hour") || s.includes("saat")) return faClock;
  if (s.includes("week") || s.includes("haft")) return faCalendarDays;
  if (s.includes("night") || s.includes("gece") || s.includes("over")) return faMoon;
  if (s.includes("day") || s.includes("gün")) return faSun;
  return faAnchor;
}

export interface StepProps {
  boat: SerializedBoat;
  config: OnboardingConfig | ResolvedOnboardingConfig;
  onSaved: (b: SerializedBoat) => void;
  reload: () => Promise<SerializedBoat>;
  goBack: () => void;
  syncBoat?: (b: SerializedBoat) => void;
  onAutosaveStatusChange?: (status: import("../../lib/hooks/useAutosaveDraft").AutosaveStatus) => void;
  onFeatureSubTabChange?: (tab: FeatureSubTabId) => void;
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
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-ink">{title}</h1>
        {description ? <p className="text-body-sm text-gray-500">{description}</p> : null}
      </div>
      <div className="space-y-8">{children}</div>
      <div className="flex items-center justify-between pt-2">
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
      className="-ml-2 flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm font-medium text-gray-500 transition hover:bg-gray-100/70 hover:text-ink"
    >
      <FontAwesomeIcon icon={faArrowLeft} className="text-[14px]" aria-hidden />
      Geri
    </button>
  );
}

/** Label + trailing arrow used by every "Kaydet & Devam" action. */
function SaveLabel({ busy }: { busy: boolean }) {
  if (busy) return <>Kaydediliyor…</>;
  return (
    <>
      Kaydet &amp; Devam
      <FontAwesomeIcon icon={faArrowRight} className="text-[14px]" aria-hidden />
    </>
  );
}

/* ----------------------- Step 1: Listing model -------------------- */

export function ListingModelStep({
  boat,
  config,
  onSaved,
  goBack,
  syncBoat,
  onAutosaveStatusChange,
}: StepProps) {
  const [selected, setSelected] = useState<string[]>(
    boat.listingModels.map((m) => m.key)
  );
  const [approvalType, setApprovalType] = useState(boat.approvalType);
  const { busy, fieldErrors, errorSummary, run } = useStepSaver(onSaved);
  const { scheduleSave } = useStepDraftAutosave({
    boatId: boat.id,
    step: OnboardingStep.LISTING_MODEL,
    getPayload: () => ({ listingModelKeys: selected, approvalType }),
    deps: [selected, approvalType],
    onSaved: syncBoat,
    onStatusChange: onAutosaveStatusChange,
  });

  function toggle(key: string) {
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
    scheduleSave(true);
  }

  const packageHint = useMemo(
    () => describeListingModelPackages(selected),
    [selected]
  );

  return (
    <StepShell
      title="Kiralama Modeli"
      description="Saatlik (Hourly/Daily) ve konaklamalı (Overnight/Weekly) modeller farklı zorunlu alan setleri kullanır. Birden fazla seçersen kurallar birleşir."
      footer={
        <>
          <BackButton onClick={goBack} show={false} />
          <Button
            disabled={busy || selected.length === 0}
            onClick={() =>
              run(() => api.updateListingModel(boat.id, { listingModelKeys: selected, approvalType }))
            }
          >
            <SaveLabel busy={busy} />
          </Button>
        </>
      }
    >
      <StepValidationAlert fieldErrors={fieldErrors} errorSummary={errorSummary} />
      {packageHint ? (
        <Alert variant="info" className="mb-4">
          {packageHint}
        </Alert>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2" data-field="listingModelKeys">
        {config.listingModels.map((m) => {
          const isSelected = selected.includes(m.key);
          return (
            <label
              key={m.key}
              className={cn(
                "relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition",
                isSelected
                  ? "border-brand-500 bg-brand-500/[0.06] shadow-sm"
                  : "border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(m.key)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                  isSelected ? "bg-brand-500/10 text-brand-600" : "bg-white text-gray-400"
                )}
              >
                <FontAwesomeIcon
                  icon={listingModelIcon(m.label || m.key)}
                  className="text-[18px]"
                  aria-hidden
                />
              </span>
              <span className="min-w-0 pr-6">
                <span
                  className={cn(
                    "block font-medium",
                    isSelected ? "text-ink" : "text-gray-700"
                  )}
                >
                  {m.label}
                </span>
                {LISTING_MODEL_BRIEFS[m.key as keyof typeof LISTING_MODEL_BRIEFS] ? (
                  <span className="mt-1 block text-[12px] leading-relaxed text-gray-500">
                    {LISTING_MODEL_BRIEFS[m.key as keyof typeof LISTING_MODEL_BRIEFS]}
                  </span>
                ) : null}
              </span>
              {isSelected ? (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                  <FontAwesomeIcon icon={faCheck} className="text-[11px]" aria-hidden />
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      <div data-field="approvalType">
        <Field label="Onay tipi" hint="Anında onay mı, manuel onay mı isteniyor?" error={fieldErrors.approvalType}>
          <Select
            value={approvalType}
            error={!!fieldErrors.approvalType}
            onChange={(e) => {
              setApprovalType(e.target.value as "INSTANT" | "MANUAL");
              scheduleSave(true);
            }}
          >
          <option value="INSTANT">Anında onay (INSTANT)</option>
          <option value="MANUAL">Manuel onay (MANUAL)</option>
        </Select>
      </Field>
      </div>
    </StepShell>
  );
}

/* ------------------ Step 2: Boat type & features ------------------ */

export function BoatTypeFeaturesStep({
  boat,
  config,
  onSaved,
  goBack,
  onFeatureSubTabChange,
  syncBoat,
  onAutosaveStatusChange,
}: StepProps) {
  const initialFeatures = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of boat.features) map[f.key] = f.value ?? "";
    return map;
  }, [boat.features]);

  const [activeTab, setActiveTab] = useState<FeatureSubTabId>("identity");
  // Kilitli bir sekmeye tıklandığında gösterilen geçici amber uyarı (3 sn sonra kaybolur).
  const [tabWarning, setTabWarning] = useState<FeatureSubTabId | null>(null);
  const tabWarningTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [boatTypeKey, setBoatTypeKey] = useState(boat.boatType?.key ?? "");
  const [values, setValues] = useState<Record<string, string>>(initialFeatures);
  const [engineType, setEngineType] = useState<EngineType | "">(boat.engineType ?? "");
  const [cabinConfigurations, setCabinConfigurations] = useState<CabinConfigurationInput[]>(
    () => toCabinInputs(boat.cabinConfigurations)
  );
  const [noCrewMembers, setNoCrewMembers] = useState(
    boat.features.find((f) => f.key === "number_of_crew_members")?.value === "0"
  );
  const pendingBrandRequestRef = useRef<BrandModelPendingRequest | null>(null);
  const { busy, fieldErrors, errorSummary, run } = useStepSaver(onSaved);

  const buildFeaturesPayload = useCallback(() => {
    const features = buildFeatureWritesFromValues(values);
    return {
      boatTypeKey: boatTypeKey || undefined,
      features,
      noCrewMembers: noCrewMembers || undefined,
      ...(engineType ? { engineType } : {}),
      ...(cabinConfigurations.length > 0 ? { cabinConfigurations } : {}),
    };
  }, [values, boatTypeKey, noCrewMembers, engineType, cabinConfigurations]);

  const { flush: flushFeaturesDraft } = useStepDraftAutosave({
    boatId: boat.id,
    step: OnboardingStep.BOAT_TYPE_FEATURES,
    getPayload: buildFeaturesPayload,
    deps: [values, boatTypeKey, noCrewMembers, engineType, cabinConfigurations],
    onSaved: syncBoat,
    onStatusChange: onAutosaveStatusChange,
  });

  const tabErrorCounts = useMemo(() => {
    const counts: Partial<Record<FeatureSubTabId, number>> = {};
    for (const key of Object.keys(fieldErrors)) {
      const tab = featureFieldSubTab(key);
      counts[tab] = (counts[tab] ?? 0) + 1;
    }
    return counts;
  }, [fieldErrors]);

  useEffect(() => {
    prefetchBrandCatalog();
  }, []);

  useEffect(() => {
    onFeatureSubTabChange?.(activeTab);
  }, [activeTab, onFeatureSubTabChange]);

  const hasListingModels = boat.listingModels.length > 0;
  const listingModelKeys = useMemo(
    () => boat.listingModels.map((m) => m.key),
    [boat.listingModels]
  );
  const requiredFeatureKeys = useMemo(() => {
    if (!isResolvedConfig(config)) return new Set<string>();
    return new Set(getRequiredFeatureKeysForStep(config.fields, listingModelKeys));
  }, [config, listingModelKeys]);

  const tabGroups = FEATURE_SUB_TABS.map((tab) => ({
    ...tab,
    groups: filterFeatureGroupsBySubTab(config.featureGroups, tab.id),
  })).filter((t) => t.groups.length > 0);

  // Alanların gerçekten bu tekne konfigürasyonunda gösterilip gösterilmediği.
  // Açık tamamlanma kuralları yalnızca ekranda var olan alanlar için uygulanır;
  // böylece config bir alanı hiç sunmuyorsa sekme kalıcı olarak kilitlenmez.
  const availableFeatureKeys = useMemo(() => {
    const set = new Set<string>();
    for (const group of config.featureGroups) {
      for (const feature of group.features) set.add(feature.key);
    }
    return set;
  }, [config.featureGroups]);

  // Airbnb-style gating within the Features step: a sub-tab can only be opened
  // once the preceding sub-tab is complete. Completion is derived from the
  // existing form state — no extra state is stored. Config-required alanlara ek
  // olarak dokümandaki net zorunlu alanları (tekne adı, kapasite, üretim yılı,
  // boy, motor gücü) de şart koşuyoruz ki sekmeler boşken açılmasın.
  const isFilled = (key: string) => String(values[key] ?? "").trim().length > 0;
  const numGreaterThan = (key: string, min: number) => {
    const n = Number(values[key]);
    return isFilled(key) && Number.isFinite(n) && n > min;
  };
  // Alan config'de yoksa bu kuralı atla (true), varsa gerçek kontrolü uygula.
  const ruleFor = (key: string, check: () => boolean) =>
    availableFeatureKeys.has(key) ? check() : true;
  const requiredKeysForTab = (tab: FeatureSubTabId) =>
    [...requiredFeatureKeys].filter((key) => featureFieldSubTab(key) === tab);

  const identityComplete = boatTypeKey.trim().length > 0;
  const specsComplete =
    identityComplete &&
    requiredKeysForTab("specs").every(isFilled) &&
    ruleFor("boat_name", () => isFilled("boat_name")) &&
    ruleFor("capacity", () => numGreaterThan("capacity", 0)) &&
    ruleFor("year_of_manufacture", () => numGreaterThan("year_of_manufacture", 1900)) &&
    ruleFor("length_ft_m", () => numGreaterThan("length_ft_m", 0));
  const engineComplete =
    specsComplete &&
    engineType.trim().length > 0 &&
    requiredKeysForTab("engine").every(isFilled) &&
    // Motor gücü dolu VEYA motorsuz (yelkenli, motorsuz) seçili olmalı.
    (engineType === EngineType.SAIL_NO_ENGINE ||
      ruleFor("total_engine_power_hp", () => numGreaterThan("total_engine_power_hp", 0)));
  const cabinsComplete = engineComplete && requiredKeysForTab("cabins").every(isFilled);

  const tabComplete: Record<FeatureSubTabId, boolean> = {
    identity: identityComplete,
    specs: specsComplete,
    engine: engineComplete,
    cabins: cabinsComplete,
  };
  const tabReachable: Record<FeatureSubTabId, boolean> = {
    identity: true,
    specs: tabComplete.identity,
    engine: tabComplete.identity && tabComplete.specs,
    cabins: tabComplete.identity && tabComplete.specs && tabComplete.engine,
  };
  const TAB_LOCK_HINT: Record<FeatureSubTabId, string> = {
    identity: "",
    specs: 'Devam etmek için "Tekne Kimliği" bölümünü tamamlayın.',
    engine: 'Devam etmek için "Tekne Özellikleri" bölümünü tamamlayın.',
    cabins: 'Devam etmek için "Motor" bölümünü tamamlayın.',
  };
  const firstLockedHint =
    FEATURE_SUB_TABS.find((t) => !tabReachable[t.id])?.id &&
    TAB_LOCK_HINT[FEATURE_SUB_TABS.find((t) => !tabReachable[t.id])!.id];
  // Kilitli sekmeye tıklandığında amber uyarıyı göster ve 3 sn sonra gizle.
  const showTabWarning = useCallback((id: FeatureSubTabId) => {
    setTabWarning(id);
    if (tabWarningTimeout.current) clearTimeout(tabWarningTimeout.current);
    tabWarningTimeout.current = setTimeout(() => setTabWarning(null), 3000);
  }, []);
  useEffect(() => {
    return () => {
      if (tabWarningTimeout.current) clearTimeout(tabWarningTimeout.current);
    };
  }, []);
  // Keep the active tab valid: if the current tab becomes unreachable, fall back
  // to the first reachable tab.
  useEffect(() => {
    if (!tabReachable[activeTab]) {
      const fallback = FEATURE_SUB_TABS.find((t) => tabReachable[t.id])?.id ?? "identity";
      if (fallback !== activeTab) setActiveTab(fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    tabReachable.identity,
    tabReachable.specs,
    tabReachable.engine,
    tabReachable.cabins,
  ]);

  function save() {
    const features = buildFeatureWritesFromValues(values);
    const payload = {
      boatTypeKey,
      features,
      noCrewMembers: noCrewMembers || undefined,
      engineType: engineType || null,
      cabinConfigurations,
    };

    if (isResolvedConfig(config)) {
      const required = getRequiredFeatureKeysForStep(config.fields, listingModelKeys);
      const result = buildBoatTypeFeaturesSchema(required).safeParse(payload);
      if (!result.success) {
        const { fields, message } = buildValidationErrorResponse(result.error);
        return Promise.reject(
          new ApiError(400, message, { code: "VALIDATION_ERROR", fields })
        );
      }
    }

    const pending = pendingBrandRequestRef.current;
    return api
      .updateBoatTypeFeatures(boat.id, payload)
      .then(async (saved) => {
        if (pending?.requestedBrand.trim()) {
          await api.createBrandModelRequest({
            requestedBrand: pending.requestedBrand.trim(),
            requestedModel: pending.requestedModel?.trim() || null,
            boatTypeKey,
          });
        }
        return saved;
      });
  }

  return (
    <StepShell
      title="Özellikler"
      description="Tekne, motor ve kabin bilgilerini doldur. Alanlar kiralama modeline göre filtrelenir."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button
            disabled={
              busy ||
              !boatTypeKey ||
              !hasListingModels ||
              // Aktif sekmenin zorunlu alanları dolmadan devam edilemez.
              // Kabin + Tuvalet son sekme; tam doğrulama kaydetme anında çalışır.
              (activeTab !== "cabins" && !tabComplete[activeTab])
            }
            onClick={() =>
              run(save, {
                onValidation: (errors) => {
                  const tab = firstSubTabWithErrors(errors);
                  if (tab) setActiveTab(tab);
                },
              })
            }
          >
            <SaveLabel busy={busy} />
          </Button>
        </>
      }
    >
      {/* Büyük alan-hata banner'ı kaldırıldı; hatalar ilgili alanın altında inline
          gösteriliyor ve hatalı sekme kırmızı nokta ile işaretleniyor. Yalnızca
          alan-dışı genel hatalar (ör. ağ hatası) burada gösterilir. */}
      {errorSummary ? <Alert>{errorSummary}</Alert> : null}
      {!hasListingModels ? (
        <Alert variant="info">Önce 1. adımda kiralama modeli seçmelisin.</Alert>
      ) : null}

      <div className="mb-6">
        <Tabs
          items={FEATURE_SUB_TABS.map((t) => ({
            id: t.id,
            label: t.label,
            disabled: !tabReachable[t.id],
            lockedHint: TAB_LOCK_HINT[t.id],
            badge: !tabReachable[t.id] ? (
              <FontAwesomeIcon icon={faLock} className="text-[11px]" aria-hidden />
            ) : tabErrorCounts[t.id] && tabErrorCounts[t.id]! > 0 ? (
              <span
                className="inline-flex h-2 w-2 rounded-full bg-danger-500"
                aria-label={`${tabErrorCounts[t.id]} hatalı alan`}
              />
            ) : undefined,
          }))}
          activeId={activeTab}
          onChange={(id) => {
            void flushFeaturesDraft();
            setActiveTab(id as FeatureSubTabId);
            setTabWarning(null);
          }}
          onLockedClick={(id) => showTabWarning(id as FeatureSubTabId)}
        />
        {tabWarning ? (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-amber-600">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-[12px]" aria-hidden />
            {TAB_LOCK_HINT[tabWarning]}
          </p>
        ) : firstLockedHint ? (
          <p className="mt-2 text-[12px] text-gray-500">{firstLockedHint}</p>
        ) : null}
      </div>

      {activeTab === "identity" ? (
        <section className="space-y-4">
          <p className="text-[13px] leading-relaxed text-gray-500">
            Teknenin tipini, markasını ve modelini seç. Bu bilgiler ilanının kimliğini
            oluşturur.
          </p>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div data-field="boatTypeKey">
              <Field label="Tekne tipi" required error={fieldErrors.boatTypeKey}>
                <Select
                  leftIcon={faAnchor}
                  value={boatTypeKey}
                  error={!!fieldErrors.boatTypeKey}
                  onChange={(e) => setBoatTypeKey(e.target.value)}
                >
                  <option value="">Seçiniz…</option>
                  {config.boatTypes.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <BrandModelFields
              boatTypeKey={boatTypeKey}
              values={values}
              isGulet={isGuletBoatType(boatTypeKey)}
              fieldErrors={fieldErrors}
              onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
              onPendingRequestChange={(req) => {
                pendingBrandRequestRef.current = req;
              }}
            />
          </div>
        </section>
      ) : null}

      {activeTab === "specs" ? (
        <p className="mb-1 text-[13px] leading-relaxed text-gray-500">{SPECS_NUMERIC_HINT}</p>
      ) : null}

      {activeTab === "engine" ? (
        <div data-field="engineType">
          <Field label="Motor Tipi" error={fieldErrors.engineType}>
            <Select
              value={engineType}
              error={!!fieldErrors.engineType}
              onChange={(e) => setEngineType(e.target.value as EngineType | "")}
            >
            <option value="">Seçiniz…</option>
            {Object.values(EngineType).map((type) => (
              <option key={type} value={type}>
                {ENGINE_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>
        </div>
      ) : null}

      {activeTab === "cabins" ? (
        <>
          <p className="mb-4 text-[13px] leading-relaxed text-gray-500">{CABINS_REQUIRED_HINT}</p>
          <CrewFieldsSection
            values={values}
            noCrewMembers={noCrewMembers}
            fieldErrors={fieldErrors}
            requiredKeys={requiredFeatureKeys}
            onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
            onNoCrewMembersChange={setNoCrewMembers}
          />
          <CabinConfigurationSection
            configurations={cabinConfigurations}
            onChange={setCabinConfigurations}
          />
        </>
      ) : null}

      <FeatureFieldsGrid
        groups={tabGroups.find((t) => t.id === activeTab)?.groups ?? []}
        values={values}
        engineType={engineType || null}
        fieldErrors={fieldErrors}
        requiredKeys={requiredFeatureKeys}
        onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
      />
    </StepShell>
  );
}

/* ------------------------ Step 3: Amenities ----------------------- */

interface AmenityState {
  included: boolean;
  isExtra: boolean;
  extraPrice: string;
}

export function AmenitiesStep({
  boat,
  config,
  onSaved,
  goBack,
  syncBoat,
  onAutosaveStatusChange,
}: StepProps) {
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

  const categories = config.amenityCategories;
  const modelKeys = useMemo(() => boat.listingModels.map((m) => m.key), [boat.listingModels]);
  const requiredAmenityKeys = useMemo(() => {
    if (!isResolvedConfig(config)) return [];
    return getRequiredAmenityKeys(config.fields, modelKeys);
  }, [config, modelKeys]);
  const amenityLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cat of categories) {
      for (const a of cat.amenities) map[a.key] = getFieldLabel(a);
    }
    return map;
  }, [categories]);

  const [activeCategory, setActiveCategory] = useState(categories[0]?.key ?? "");
  const [state, setState] = useState<Record<string, AmenityState>>(initial);
  const [showSummary, setShowSummary] = useState(false);
  const { busy, fieldErrors, errorSummary, run } = useStepSaver(onSaved);

  const selectedByCategory = useMemo(
    () =>
      categories
        .map((cat) => ({
          key: cat.key,
          label: cat.label,
          items: cat.amenities.filter(
            (a) => state[a.key]?.included || state[a.key]?.isExtra
          ),
        }))
        .filter((c) => c.items.length > 0),
    [categories, state]
  );
  const totalSelected = useMemo(
    () => Object.values(state).filter((v) => v.included || v.isExtra).length,
    [state]
  );
  const totalExtraPrice = useMemo(
    () =>
      Object.values(state).reduce(
        (sum, v) => (v.isExtra ? sum + (Number(v.extraPrice) || 0) : sum),
        0
      ),
    [state]
  );
  const extraCount = useMemo(
    () => Object.values(state).filter((v) => v.isExtra).length,
    [state]
  );

  const buildSavePayload = useCallback(
    () => ({
      amenities: Object.entries(state)
        .filter(([, v]) => v.included || v.isExtra)
        .map(([amenityKey, v]) => ({
          amenityKey,
          isIncluded: v.included && !v.isExtra,
          isExtra: v.isExtra,
          extraPrice: v.isExtra ? Number(v.extraPrice || 0) : null,
          currency: v.isExtra ? "TRY" : null,
        })),
    }),
    [state]
  );

  const categoryErrorCounts = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    for (const key of Object.keys(fieldErrors)) {
      const cat = categories.find((c) => c.amenities.some((a) => a.key === key));
      if (cat) counts[cat.key] = (counts[cat.key] ?? 0) + 1;
    }
    return counts;
  }, [fieldErrors, categories]);

  const buildAmenitiesPayload = buildSavePayload;

  const { scheduleSave: scheduleAmenitiesSave } = useStepDraftAutosave({
    boatId: boat.id,
    step: OnboardingStep.AMENITIES,
    getPayload: buildAmenitiesPayload,
    deps: [state],
    onSaved: syncBoat,
    onStatusChange: onAutosaveStatusChange,
  });

  function set(key: string, patch: Partial<AmenityState>) {
    setState((s) => ({
      ...s,
      [key]: { included: false, isExtra: false, extraPrice: "", ...s[key], ...patch },
    }));
    scheduleAmenitiesSave(true);
  }

  function save() {
    const payload = buildSavePayload();

    const result = buildAmenitiesSchema(requiredAmenityKeys).safeParse(payload);
    if (!result.success) {
      const { fields, message } = buildValidationErrorResponse(result.error);
      return Promise.reject(
        new ApiError(400, message, { code: "VALIDATION_ERROR", fields })
      );
    }

    return api.updateAmenities(boat.id, payload);
  }

  return (
    <StepShell
      title="Donanımlar"
      description="Teknende bulunan donanımları işaretle. Olmayan donanımları boş bırakman yeterli — hiçbiri işaretlenmek zorunda değil."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button
            disabled={busy || boat.listingModels.length === 0}
            onClick={() => setShowSummary(true)}
          >
            <SaveLabel busy={busy} />
          </Button>
        </>
      }
    >
      <StepValidationAlert
        fieldErrors={fieldErrors}
        errorSummary={errorSummary}
        fieldLabels={amenityLabels}
      />
      {boat.listingModels.length === 0 ? (
        <Alert variant="info">Önce 1. adımda kiralama modeli seçmelisin.</Alert>
      ) : categories.length > 0 ? (
        <p className="mb-4 text-[13px] leading-relaxed text-gray-500">
          Var olan donanımları işaretle. Ekstra ücretli seçersen fiyat girmelisin.
        </p>
      ) : null}
      {config.amenityCategories.length === 0 && boat.listingModels.length > 0 ? (
        <Alert variant="info">Bu kiralama modeli için donanım listesi yok.</Alert>
      ) : null}

      {categories.length > 0 ? (
        <Tabs
          items={categories.map((c) => ({
            id: c.key,
            label: c.label,
            badge:
              categoryErrorCounts[c.key] && categoryErrorCounts[c.key]! > 0 ? (
                <span
                  className="inline-flex h-2 w-2 rounded-full bg-danger-500"
                  aria-label={`${categoryErrorCounts[c.key]} hatalı donanım`}
                />
              ) : undefined,
          }))}
          activeId={activeCategory || categories[0]?.key || "default"}
          onChange={setActiveCategory}
          className="mb-6"
        />
      ) : null}

      {categories
        .filter((cat) => cat.key === (activeCategory || categories[0]?.key))
        .map((cat) => (
        <section key={cat.key} className="space-y-4">
          <div className="space-y-3">
            {cat.amenities.map((a) => {
              const st = state[a.key] ?? {
                included: false,
                isExtra: false,
                extraPrice: "",
              };
              return (
                <div key={a.key} data-field={a.key} className="flex flex-wrap items-center gap-4">
                  <Checkbox
                    label={
                      requiredAmenityKeys.includes(a.key) ? (
                        <>
                          {getFieldLabel(a)}
                          <span className="ml-0.5 text-danger-500" aria-hidden>
                            *
                          </span>
                        </>
                      ) : (
                        getFieldLabel(a)
                      )
                    }
                    checked={st.included || st.isExtra}
                    onChange={(e) =>
                      set(a.key, {
                        included: e.target.checked,
                        isExtra: e.target.checked ? st.isExtra : false,
                      })
                    }
                  />
                  {fieldErrors[a.key] ? (
                    <p className="w-full text-caption text-danger-600">{fieldErrors[a.key]}</p>
                  ) : null}
                  {a.canBeExtra &&
                  amenityCategoryAllowsExtra(cat.key) &&
                  (st.included || st.isExtra) ? (
                    <>
                      <Checkbox
                        label="Ekstra ücretli"
                        checked={st.isExtra}
                        onChange={(e) => set(a.key, { isExtra: e.target.checked })}
                      />
                      {st.isExtra ? (
                        <div className="flex items-center gap-1" data-field={`${a.key}-price`}>
                          <Input
                            type="number"
                            min={1}
                            value={st.extraPrice}
                            error={!!fieldErrors[a.key]}
                            onChange={(e) => set(a.key, { extraPrice: e.target.value })}
                            className="h-8 w-24"
                            placeholder="Fiyat"
                          />
                          <span className="text-xs text-slate-500">₺</span>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <Modal
        open={showSummary}
        onClose={() => setShowSummary(false)}
        title="Seçilen Donanımlar — Özet"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowSummary(false)}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-[13px]" aria-hidden />
              Geri Dön, Düzenle
            </button>
            <Button
              disabled={busy}
              onClick={() => {
                setShowSummary(false);
                run(save, {
                  onValidation: (errors) => {
                    const firstKey = Object.keys(errors)[0];
                    if (!firstKey) return;
                    const cat = categories.find((c) =>
                      c.amenities.some((a) => a.key === firstKey)
                    );
                    if (cat) setActiveCategory(cat.key);
                  },
                });
              }}
            >
              Onayla &amp; Devam
            </Button>
          </>
        }
      >
        {totalSelected === 0 ? (
          <p className="text-body-sm text-gray-500">
            Henüz donanım seçmedin. Teknende bulunan donanımları işaretlemen önerilir; yine
            de bu adımı boş geçebilirsin.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-body-sm text-gray-500">
              Toplam {totalSelected} donanım seçtin. Ekstra ücretli olanların fiyatını
              aşağıdan düzenleyebilirsin; değişiklikler otomatik kaydedilir.
            </p>
            {selectedByCategory.map((cat) => (
              <div key={cat.key}>
                <h4 className="mb-2 text-caption font-semibold uppercase tracking-wide text-gray-400">
                  {cat.label}
                </h4>
                <div className="space-y-1.5">
                  {cat.items.map((a) => {
                    const st = state[a.key];
                    const isExtra = !!st?.isExtra;
                    return (
                      <div
                        key={a.key}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-[13px] text-ink">
                          <span
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full",
                              isExtra ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            aria-hidden
                          />
                          <span className="truncate">{getFieldLabel(a)}</span>
                        </span>
                        {isExtra ? (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Input
                              type="number"
                              min={1}
                              value={st?.extraPrice ?? ""}
                              error={!!fieldErrors[a.key]}
                              onChange={(e) => set(a.key, { extraPrice: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                              }}
                              className="h-9 w-20 text-right"
                              placeholder="0"
                              aria-label={`${getFieldLabel(a)} ekstra ücreti`}
                            />
                            <span className="text-[13px] text-gray-500">₺</span>
                          </div>
                        ) : (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                            Fiyata dahil
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {extraCount > 0 ? (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-body-sm text-gray-600">
                  {extraCount} ekstra ücretli seçenek
                </span>
                <span className="text-body-sm font-semibold text-ink">
                  Toplam ₺{totalExtraPrice.toLocaleString("tr-TR")}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </StepShell>
  );
}

/* ------------------------ Step 4: Location ---------------------- */

export function LocationStep({
  boat,
  config,
  onSaved,
  goBack,
  syncBoat,
  onAutosaveStatusChange,
}: StepProps) {
  const locationFields = getConfigFieldsForStep(config, OnboardingStep.LOCATION);
  const formFields = locationFields.filter((f) =>
    (LOCATION_FORM_FIELD_KEYS as readonly string[]).includes(f.key)
  );
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const initialFeatures = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of boat.features) map[f.key] = f.value ?? "";
    return map;
  }, [boat.features]);

  const [values, setValues] = useState<Record<string, string>>(initialFeatures);
  const { busy, fieldErrors, errorSummary, run } = useStepSaver(onSaved);

  const buildFeatures = useCallback(
    () =>
      LOCATION_FIELD_KEYS.map((key) => ({
        key,
        value: values[key]?.trim() || "",
      })).filter((f) => f.value),
    [values]
  );

  useStepDraftAutosave({
    boatId: boat.id,
    step: OnboardingStep.LOCATION,
    getPayload: () => ({ features: buildFeatures() }),
    deps: [values],
    onSaved: syncBoat,
    onStatusChange: onAutosaveStatusChange,
  });

  function save() {
    return api.updateLocation(boat.id, { features: buildFeatures() });
  }

  const pickerValue = {
    latitude: values.latitude ? Number.parseFloat(values.latitude) : null,
    longitude: values.longitude ? Number.parseFloat(values.longitude) : null,
    address: values.address || null,
    marina: values.marina || null,
    city: values.city || null,
    region: values.region || null,
    country: values.country || null,
  };

  return (
    <StepShell
      title="Konum"
      description="Marina veya limanı arayın, ardından haritada tam konumu iğne ile işaretleyin."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button
            disabled={busy || boat.listingModels.length === 0}
            onClick={() => run(save)}
          >
            <SaveLabel busy={busy} />
          </Button>
        </>
      }
    >
      <StepValidationAlert fieldErrors={fieldErrors} errorSummary={errorSummary} />
      {boat.listingModels.length === 0 ? (
        <Alert variant="info">Önce 1. adımda kiralama modeli seçmelisin.</Alert>
      ) : null}

      <LocationPicker
        className="mb-6"
        mapboxToken={mapboxToken}
        value={pickerValue}
        onChange={(next) => {
          setValues((prev) => ({
            ...prev,
            latitude: next.latitude != null ? String(next.latitude) : "",
            longitude: next.longitude != null ? String(next.longitude) : "",
            address: next.address ?? prev.address ?? "",
            marina: next.marina ?? prev.marina ?? "",
            city: next.city ?? prev.city ?? "",
            region: next.region ?? prev.region ?? "",
            country: next.country ?? prev.country ?? "",
          }));
        }}
      />

      {formFields.length > 0 ? (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {formFields.map((f) => (
            <div key={f.key} data-field={f.key}>
              <Field label={getFieldLabel(f)} error={fieldErrors[f.key]}>
                <Input
                  value={values[f.key] ?? ""}
                  error={!!fieldErrors[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </Field>
            </div>
          ))}
        </div>
      ) : null}
    </StepShell>
  );
}

/* ------------------- Step 5: Description & rules ------------------ */

/**
 * Fixed boat-rule toggles shown in the Description step. Answers are stored as
 * booleans inside the boat's `structuredRules` JSON (no schema change needed);
 * `readFieldValues` reads them back automatically. `alcohol_allowed` and
 * `outside_food_drink_allowed` reuse the existing seed keys for backwards
 * compatibility; the rest are description-only rule keys.
 */
const BOAT_RULE_TOGGLES: { key: string; label: string }[] = [
  { key: "outside_food_drink_allowed", label: "Dışarıdan yiyecek/içecek getirilebilir" },
  { key: "alcohol_allowed", label: "Alkol tüketimi serbesttir" },
  { key: "smoking_outdoor_only", label: "Sigara içilebilir (sadece açık alanda)" },
  { key: "pets_not_allowed", label: "Evcil hayvan kabul edilmez" },
  { key: "crew_instructions_mandatory", label: "Mürettebat talimatlarına uymak zorunludur" },
  { key: "diving_swimming_allowed", label: "Dalış/yüzme izinlidir" },
  { key: "music_system_allowed", label: "Müzik/ses sistemi kullanılabilir" },
  { key: "no_shoes_onboard", label: "Tekne içinde ayakkabı giyilemez" },
];

function RuleYesNoToggle({
  value,
  onChange,
}: {
  value: string | boolean | undefined;
  // `null` clears the selection (rule left unanswered).
  onChange: (val: boolean | null) => void;
}) {
  const yes = value === true || value === "true";
  const no = value === false || value === "false";
  const pill = (active: boolean, tone: "yes" | "no") =>
    cn(
      "inline-flex h-9 min-w-[68px] items-center justify-center gap-1.5 rounded-full border-2 px-4 text-[13px] font-medium transition-all",
      active
        ? tone === "yes"
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-danger-500 bg-danger-500 text-white"
        : tone === "yes"
          ? "border-gray-200 bg-white text-gray-600 hover:border-brand-500 hover:text-brand-600"
          : "border-gray-200 bg-white text-gray-600 hover:border-danger-400 hover:text-danger-500"
    );
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        className={pill(yes, "yes")}
        aria-pressed={yes}
        onClick={() => onChange(yes ? null : true)}
      >
        {yes ? <FontAwesomeIcon icon={faCheck} className="text-[11px]" aria-hidden /> : null}
        Evet
      </button>
      <button
        type="button"
        className={pill(no, "no")}
        aria-pressed={no}
        onClick={() => onChange(no ? null : false)}
      >
        {no ? <FontAwesomeIcon icon={faCheck} className="text-[11px]" aria-hidden /> : null}
        Hayır
      </button>
    </div>
  );
}

export function DescriptionRulesStep({
  boat,
  config,
  onSaved,
  goBack,
  syncBoat,
  onAutosaveStatusChange,
}: StepProps) {
  const stepFields = getConfigFieldsForStep(config, OnboardingStep.DESCRIPTION_RULES);
  const initialValues = useMemo(
    () => readFieldValues(boat, stepFields),
    [boat, stepFields]
  );
  const [values, setValues] = useState<FieldValueMap>(initialValues);
  const { busy, fieldErrors, errorSummary, run } = useStepSaver(onSaved);

  useStepDraftAutosave({
    boatId: boat.id,
    step: OnboardingStep.DESCRIPTION_RULES,
    getPayload: () => ({
      title: String(values.listing_title ?? boat.title ?? "").trim(),
      description: String(values.description ?? ""),
      fieldValues: values,
    }),
    deps: [values, boat.title],
    onSaved: syncBoat,
    onStatusChange: onAutosaveStatusChange,
  });

  function setValue(key: string, value: string | boolean) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  // Rule toggles are tri-state: `null` removes the key entirely so the rule is
  // saved as "unanswered" (structuredRules is replaced, not merged, server-side).
  function setRule(key: string, value: boolean | null) {
    setValues((v) => {
      if (value === null) {
        const next = { ...v };
        delete next[key];
        return next;
      }
      return { ...v, [key]: value };
    });
  }

  function save() {
    const title = String(values.listing_title ?? boat.title ?? "").trim();
    const payload = {
      title,
      description: String(values.description ?? ""),
      fieldValues: values,
    };

    if (isResolvedConfig(config)) {
      const modelKeys = boat.listingModels.map((m) => m.key);
      const required = getRequiredDescriptionFieldKeys(config.fields, modelKeys);
      // Pet policy is no longer required; boat rules are optional too.
      const result = buildDescriptionRulesSchema(required, []).safeParse(payload);
      if (!result.success) {
        const { fields, message } = buildValidationErrorResponse(result.error);
        return Promise.reject(
          new ApiError(400, message, { code: "VALIDATION_ERROR", fields })
        );
      }
    }

    return api.updateDescriptionRules(boat.id, payload);
  }

  const hasTitle = stepFields.some((f) => f.key === "listing_title");
  const hasDescription = stepFields.some((f) => f.key === "description");

  const canSave =
    boat.listingModels.length > 0 &&
    (!hasTitle || String(values.listing_title ?? "").trim().length >= 3);

  const ruleErrors = BOAT_RULE_TOGGLES.map((r) => fieldErrors[r.key]).find(Boolean);

  return (
    <StepShell
      title="Açıklama ve Politikalar"
      description="İlan başlığı, açıklama ve tekne kurallarını gir. Kurallar opsiyoneldir."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button disabled={busy || !canSave} onClick={() => run(save)}>
            <SaveLabel busy={busy} />
          </Button>
        </>
      }
    >
      <StepValidationAlert fieldErrors={fieldErrors} errorSummary={errorSummary} />
      {boat.listingModels.length === 0 ? (
        <Alert variant="info">Önce 1. adımda kiralama modeli seçmelisin.</Alert>
      ) : null}

      {hasTitle || hasDescription ? (
        <section className="space-y-5">
          <h3 className="text-[15px] font-semibold text-ink">İlan Başlığı ve Açıklaması</h3>
          {hasTitle ? (
            <div data-field="listing_title">
              <Field
                label="İlan Başlığı"
                required
                hint="En az 3, en fazla 120 karakter."
                error={fieldErrors.listing_title}
              >
                <Input
                  value={String(values.listing_title ?? "")}
                  error={!!fieldErrors.listing_title}
                  maxLength={120}
                  onChange={(e) => setValue("listing_title", e.target.value)}
                  placeholder="Örn. Bodrum'da 4 kabinli lüks gulet"
                />
              </Field>
            </div>
          ) : null}
          {hasDescription ? (
            <div data-field="description">
              <Field label="Açıklama" error={fieldErrors.description}>
                <Textarea
                  rows={6}
                  value={String(values.description ?? "")}
                  error={!!fieldErrors.description}
                  maxLength={5000}
                  onChange={(e) => setValue("description", e.target.value)}
                  placeholder="Tekneni, sunduğun deneyimi ve öne çıkan özellikleri anlat."
                />
              </Field>
            </div>
          ) : null}
        </section>
      ) : null}

      <section
        className={cn(
          "space-y-4",
          (hasTitle || hasDescription) && "mt-8 border-t border-gray-200 pt-8"
        )}
      >
        <div>
          <h3 className="text-[15px] font-semibold text-ink">
            Tekne Kuralları{" "}
            <span className="font-normal text-gray-400">(opsiyonel)</span>
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
            Misafirler için geçerli kuralları belirt. Her kural için Evet ya da Hayır
            seçebilirsin; hiçbirini seçmeden de devam edebilirsin.
          </p>
        </div>
        <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
          {BOAT_RULE_TOGGLES.map((r) => (
            <div
              key={r.key}
              data-field={r.key}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span className="text-[14px] text-gray-700">{r.label}</span>
              <RuleYesNoToggle
                value={values[r.key]}
                onChange={(val) => setRule(r.key, val)}
              />
            </div>
          ))}
        </div>
        {ruleErrors ? <p className="text-caption text-danger-600">{ruleErrors}</p> : null}
      </section>
    </StepShell>
  );
}

/* --------------------------- Step 6: Photos ----------------------- */

export function PhotosStep({ boat, config, reload, goBack, onSaved }: StepProps) {
  const [uploadBusy, setUploadBusy] = useState(false);
  const { busy: saveBusy, errorSummary, run } = useStepSaver(onSaved);
  const busy = uploadBusy || saveBusy;
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const planRef = useRef<HTMLInputElement>(null);
  const photoFields = getConfigFieldsForStep(config, OnboardingStep.PHOTOS);
  const boatPlanUrl = boat.features.find((f) => f.key === "boat_plan")?.value ?? null;

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadBusy(true);
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
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(photoId: string) {
    setUploadBusy(true);
    try {
      await api.deletePhoto(boat.id, photoId);
      await reload();
    } finally {
      setUploadBusy(false);
    }
  }

  async function makeCover(photoId: string) {
    setUploadBusy(true);
    try {
      await api.setCover(boat.id, photoId);
      await reload();
    } finally {
      setUploadBusy(false);
    }
  }

  async function uploadBoatPlan(file: File) {
    setUploadBusy(true);
    setError(null);
    try {
      const upload = await api.boatPlanUploadUrl(boat.id, file.name);
      await uploadToStorage(upload, file);
      await api.registerBoatPlan(boat.id, { storagePath: upload.path });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tekne planı yüklenemedi");
    } finally {
      setUploadBusy(false);
      if (planRef.current) planRef.current.value = "";
    }
  }

  async function removeBoatPlan() {
    setUploadBusy(true);
    setError(null);
    try {
      await api.deleteBoatPlan(boat.id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tekne planı silinemedi");
    } finally {
      setUploadBusy(false);
    }
  }

  function continueStep() {
    if (boat.photos.length === 0) {
      return Promise.reject(new ApiError(400, "En az bir fotoğraf yükleyin"));
    }
    return reload();
  }

  return (
    <StepShell
      title="Fotoğraflar"
      description="En az bir fotoğraf yükle. İlk yüklenen otomatik kapak olur, dilersen değiştir."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button
            disabled={busy || boat.photos.length === 0}
            onClick={() => run(continueStep)}
          >
            <SaveLabel busy={saveBusy} />
          </Button>
        </>
      }
    >
      {error ? <Alert>{error}</Alert> : null}
      {errorSummary ? <Alert>{errorSummary}</Alert> : null}
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

      {photoFields.some((f) => f.key === "boat_plan") ? (
        <section className="space-y-3 border-t border-gray-100 pt-7">
          <h3 className="text-[15px] font-semibold text-ink">
            Tekne planı{" "}
            <span className="font-normal text-gray-400">(Opsiyonel)</span>
          </h3>
          <p className="text-body-sm text-gray-500">
            İstersen tekne planını PDF veya görsel olarak yükleyebilirsin — yüklemeden de devam
            edebilirsin.
          </p>
          {boatPlanUrl ? (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <a
                href={boatPlanUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 hover:underline"
              >
                Yüklenen plan
              </a>
              <button
                onClick={() => removeBoatPlan()}
                disabled={busy}
                className="text-xs text-red-500 hover:underline"
              >
                Sil
              </button>
            </div>
          ) : null}
          <input
            ref={planRef}
            type="file"
            accept="image/*,.pdf"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadBoatPlan(f);
            }}
            className="text-sm"
          />
        </section>
      ) : null}
    </StepShell>
  );
}

/* ----------------------- Step 6: Pricing -------------------------- */

export function PricingStep({
  boat,
  config,
  onSaved,
  goBack,
  syncBoat,
  onAutosaveStatusChange,
}: StepProps) {
  // "Tekne Kuralları" (boat_rules_and_policies) moved to the Description step as
  // structured Yes/No toggles, so it is filtered out of the Pricing step here.
  const bookingFields = getConfigFieldsForStep(config, OnboardingStep.PRICING).filter(
    (f) => f.key !== "boat_rules_and_policies"
  );
  const modelKeys = useMemo(() => boat.listingModels.map((m) => m.key), [boat.listingModels]);
  const requiredBookingKeys = useMemo(() => {
    if (!isResolvedConfig(config)) return [];
    return getRequiredPricingFieldKeys(config.fields, modelKeys).filter(
      (key) => key !== "boat_rules_and_policies"
    );
  }, [config, modelKeys]);
  const requiredKeySet = useMemo(() => new Set(requiredBookingKeys), [requiredBookingKeys]);

  const initialBookingValues = useMemo(() => {
    const rules = (boat.structuredRules ?? {}) as FieldValueMap;
    const map: FieldValueMap = {};
    for (const f of bookingFields) {
      if (BOOLEAN_BOOKING_FIELD_KEYS.has(f.key)) {
        map[f.key] = rules[f.key] === true || rules[f.key] === "true";
      } else {
        map[f.key] = rules[f.key] ?? "";
      }
    }
    // Custom deposit note (Deposit type = "Diğer") lives in structuredRules only.
    map.customDepositNote = String(rules.customDepositNote ?? "");
    return map;
  }, [boat.structuredRules, bookingFields]);

  // Split booking fields into base pricing vs. extra services (port fee,
  // cleaning, transit log, fuel, daily A/C) for the two-section layout.
  const basePricingFields = useMemo(
    () => bookingFields.filter((f) => !isExtraServicePricingField(f)),
    [bookingFields]
  );
  const extraServiceFields = useMemo(
    () => bookingFields.filter((f) => isExtraServicePricingField(f)),
    [bookingFields]
  );

  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const m of boat.listingModels) {
      const existing = boat.pricing.find((p) => p.listingModelKey === m.key);
      map[m.key] = existing ? String(existing.price) : "";
    }
    return map;
  });
  const [bookingValues, setBookingValues] = useState<FieldValueMap>(initialBookingValues);
  const [contactForFuelCost, setContactForFuelCost] = useState(
    boat.structuredRules?.contactForFuelCost === true
  );
  const { busy, fieldErrors, errorSummary, run } = useStepSaver(onSaved);
  const models = boat.listingModels;
  const timeOrderErrors = getInvalidCheckTimeGroupTitles(bookingValues);
  const hasTimeOrderError = timeOrderErrors.length > 0;

  useStepDraftAutosave({
    boatId: boat.id,
    step: OnboardingStep.PRICING,
    getPayload: () => ({
      pricing: models.map((m) => ({
        listingModelKey: m.key,
        price: Number(prices[m.key] || 0),
      })),
      bookingFields: bookingValues,
      contactForFuelCost,
    }),
    deps: [prices, bookingValues, contactForFuelCost, models],
    onSaved: syncBoat,
    onStatusChange: onAutosaveStatusChange,
  });

  function save() {
    const pricing = models.map((m) => ({
      listingModelKey: m.key,
      price: Number(prices[m.key] || 0),
      currency: "TRY" as const,
    }));

    const payload = {
      pricing,
      bookingFields: bookingValues,
      contactForFuelCost,
    };

    if (isResolvedConfig(config)) {
      const result = buildPricingSchema(requiredBookingKeys).safeParse(payload);
      if (!result.success) {
        const { fields, message } = buildValidationErrorResponse(result.error);
        return Promise.reject(
          new ApiError(400, message, { code: "VALIDATION_ERROR", fields })
        );
      }
    }

    return api.updatePricing(boat.id, payload);
  }

  if (models.length === 0) {
    return (
      <StepShell
        title="Fiyat"
        footer={<BackButton onClick={goBack} show />}
      >
        <Alert variant="info">
          Önce 1. adımda kiralama modeli seçmelisin. Fiyatlar seçilen modellere göre
          girilir.
        </Alert>
      </StepShell>
    );
  }

  const onBookingChange = (key: string, value: string | boolean) =>
    setBookingValues((v) => ({ ...v, [key]: value }));

  return (
    <StepShell
      title="Fiyatlar ve Ek Hizmetler"
      description="Model başına fiyatları, rezervasyon kurallarını ve ek hizmet ücretlerini gir."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button disabled={busy || hasTimeOrderError} onClick={() => run(save)}>
            <SaveLabel busy={busy} />
          </Button>
        </>
      }
    >
      <StepValidationAlert fieldErrors={fieldErrors} errorSummary={errorSummary} />
      {hasTimeOrderError ? (
        <Alert variant="danger">
          Çıkış saati giriş saatinden sonra olmalıdır ({timeOrderErrors.join(", ")}).
        </Alert>
      ) : null}

      <section className="space-y-6 [&_input]:text-[16px] [&_label]:text-[15px] [&_label]:text-gray-900 [&_select]:text-[16px] [&_textarea]:text-[16px]">
        <h2 className="text-[24px] font-bold tracking-[-0.01em] text-ink">Temel Fiyatlandırma</h2>
        <p className="text-[13px] text-gray-500">{PRICING_REQUIRED_HINT}</p>
        <div className="space-y-4">
          <h3 className="text-[14px] font-semibold uppercase tracking-[0.05em] text-gray-700">
            Kiralama fiyatları
          </h3>
          {models.map((m) => (
            <div key={m.key} data-field={m.key}>
              <Field
                label={getListingModelPriceLabel(m.key, m.label)}
                required
                error={fieldErrors[m.key]}
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={prices[m.key] ?? ""}
                    error={!!fieldErrors[m.key]}
                    onChange={(e) => setPrices((p) => ({ ...p, [m.key]: e.target.value }))}
                    placeholder="0"
                    className="max-w-[200px]"
                  />
                  <span className="text-sm text-slate-500">₺</span>
                </div>
              </Field>
            </div>
          ))}
        </div>
        {basePricingFields.length > 0 ? (
          <DynamicOnboardingFields
            fields={basePricingFields}
            values={bookingValues}
            onChange={onBookingChange}
            fieldErrors={fieldErrors}
            requiredKeys={requiredKeySet}
          />
        ) : null}
      </section>

      {extraServiceFields.length > 0 ? (
        <section className="mt-10 space-y-6 border-t border-gray-200 pt-8 [&_input]:text-[16px] [&_label]:text-[15px] [&_label]:text-gray-900 [&_select]:text-[16px] [&_textarea]:text-[16px]">
          <div>
            <h2 className="text-[24px] font-bold tracking-[-0.01em] text-ink">Ek Hizmetler ve Ücretler</h2>
            <p className="mt-1 text-[13px] text-gray-500">
              Her hizmet için fiyata dahil olup olmadığını, dahil değilse tahmini ücreti belirt.
            </p>
          </div>
          <DynamicOnboardingFields
            fields={extraServiceFields}
            values={bookingValues}
            onChange={onBookingChange}
            contactForFuelCost={contactForFuelCost}
            onContactForFuelCostChange={setContactForFuelCost}
            fieldErrors={fieldErrors}
            requiredKeys={requiredKeySet}
          />
        </section>
      ) : null}
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

  // "Amount of security deposit" is a pricing/deposit value, not a document
  // upload, so it is excluded from the Documents step.
  const documentTypes = config.documentTypes.filter(
    (dt) => dt.key !== "amount_of_security_deposit"
  );
  const openPreview = () =>
    window.open(`/boats/${boat.id}/preview`, "_blank", "noopener,noreferrer");

  return (
    <StepShell
      title="Belgeler"
      description="Seçtiğin kiralama modeline göre yalnızca zorunlu belgeler listelenir."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button
            variant="outline"
            onClick={openPreview}
            className="border-2 border-brand-500 font-semibold text-brand-600 hover:bg-brand-50"
          >
            <FontAwesomeIcon icon={faEye} className="text-[14px]" aria-hidden />
            İlanı Önizle
          </Button>
        </>
      }
    >
      {error ? <Alert>{error}</Alert> : null}
      {boat.listingModels.length === 0 ? (
        <Alert variant="info">Önce 1. adımda kiralama modeli seçmelisin.</Alert>
      ) : null}
      {documentTypes.map((dt) => {
        const docs = boat.documents.filter((d) => d.documentTypeKey === dt.key);
        return (
          <section key={dt.key} className="space-y-3 border-t border-gray-100 pt-7">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-ink">
                {dt.label}
                {dt.required ? <span className="text-danger-500"> *</span> : null}
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
                          {d.fileName}
                        </a>
                      ) : (
                        d.fileName
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
          </section>
        );
      })}
    </StepShell>
  );
}

/* ------------------- Step 8: Customer preview (read-only) ----------------- */

export function PreviewStep({ boat, goBack }: StepProps) {
  const model = useMemo(() => toBoatDetailViewModel(boat), [boat]);

  return (
    <StepShell
      title="Müşteri Önizlemesi"
      description="İlanın müşterilere nasıl görüneceğini kontrol et. Tam sayfa önizleme için üstteki Önizle butonunu kullan."
      footer={
        <>
          <BackButton onClick={goBack} show />
          <Button
            variant="outline"
            onClick={() => window.open(`/boats/${boat.id}/preview`, "_blank", "noopener,noreferrer")}
          >
            <FontAwesomeIcon icon={faEye} className="text-[14px]" aria-hidden />
            Yeni sekmede aç
          </Button>
        </>
      }
    >
      <Banner
        icon={faEye}
        title="Bu bir önizlemedir"
        description="Müşteriler bu sayfayı ilan onaylandıktan sonra görür."
      />
      <BoatDetailView model={model} bookingDisabled showPlaceholders />
    </StepShell>
  );
}
