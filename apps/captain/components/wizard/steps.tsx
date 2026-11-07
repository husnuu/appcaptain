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
  faBolt,
  faCalendarDays,
  faCheck,
  faClock,
  faCloudArrowUp,
  faEllipsis,
  faEye,
  faFileLines,
  faLock,
  faMoon,
  faSun,
  faTriangleExclamation,
  faUserCheck,
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
import { Alert, Field, Input, Modal, Spinner, Textarea } from "../ui";
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
import {
  ChoiceTiles,
  SectionTitle,
  SubStepTabs,
  TileCheck,
  UploadDropzone,
  WizardBackButton,
  WizardFooterBar,
  WizardHeading,
  tileClass,
} from "./focus";
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
    <div>
      <WizardHeading title={title} description={description} />
      <div className="space-y-8">{children}</div>
      <WizardFooterBar>{footer}</WizardFooterBar>
    </div>
  );
}

function BackButton({ onClick, show }: { onClick: () => void; show: boolean }) {
  if (!show) return <span />;
  return <WizardBackButton onClick={onClick} />;
}

/** Label + trailing arrow used by every "Kaydet ve ilerle" action. */
function SaveLabel({ busy }: { busy: boolean }) {
  if (busy) return <>Kaydediliyor…</>;
  return (
    <>
      Kaydet ve ilerle
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
          <Button size="lg"
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
                tileClass(isSelected),
                "flex cursor-pointer items-start gap-4 p-5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 has-[:focus-visible]:ring-offset-2"
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
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
                  isSelected ? "bg-white text-brand-500 shadow-sm" : "bg-gray-100 text-gray-500"
                )}
              >
                <FontAwesomeIcon
                  icon={listingModelIcon(m.label || m.key)}
                  className="text-[18px]"
                  aria-hidden
                />
              </span>
              <span className="min-w-0 pr-6">
                <span className="block text-[16px] font-bold leading-snug text-ink">{m.label}</span>
                {LISTING_MODEL_BRIEFS[m.key as keyof typeof LISTING_MODEL_BRIEFS] ? (
                  <span className="mt-1 block text-[13px] leading-relaxed text-gray-500">
                    {LISTING_MODEL_BRIEFS[m.key as keyof typeof LISTING_MODEL_BRIEFS]}
                  </span>
                ) : null}
              </span>
              <TileCheck on={isSelected} />
            </label>
          );
        })}
      </div>
      <div data-field="approvalType" className="border-t border-gray-200 pt-8">
        <SectionTitle hint="Rezervasyon taleplerinin nasıl onaylanacağını seç.">Onay tipi</SectionTitle>
        <ChoiceTiles<"INSTANT" | "MANUAL">
          columns={2}
          ariaLabel="Onay tipi"
          error={!!fieldErrors.approvalType}
          value={approvalType}
          onChange={(v) => {
            setApprovalType(v);
            scheduleSave(true);
          }}
          options={[
            {
              value: "INSTANT",
              label: "Anında onay",
              description: "Misafirin rezervasyonu beklemeden kesinleşir.",
              icon: faBolt,
            },
            {
              value: "MANUAL",
              label: "Manuel onay",
              description: "Her rezervasyon talebini sen onaylarsın.",
              icon: faUserCheck,
            },
          ]}
        />
        {fieldErrors.approvalType ? (
          <p className="mt-2 text-caption text-danger-600">{fieldErrors.approvalType}</p>
        ) : null}
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
  // İleri geçiş yalnızca "Kaydet & Devam" ile olur. maxReachedTab, kullanıcının
  // butonla ulaştığı en ileri sekmeyi tutar; sekmeye tıklayarak sadece bu
  // sekmeye kadar (geri) gidilebilir, daha ileriye tıklanamaz.
  const [maxReachedTab, setMaxReachedTab] = useState<FeatureSubTabId>("identity");
  const didInitReached = useRef(false);
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
  const { busy, fieldErrors, run, clearFieldError } = useStepSaver(onSaved);

  // Kullanıcı bir alanı düzenlemeye başlayınca o alanın hatasını temizle;
  // hatalar yalnızca "Kaydet & Devam" sonrası görünür, düzeltince kaybolur.
  const updateValue = useCallback(
    (key: string, value: string) => {
      setValues((v) => ({ ...v, [key]: value }));
      clearFieldError(key);
    },
    [clearFieldError]
  );

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

  // Tekne Kimliği: Tip + Marka + Model üçü de dolu olmalı.
  const identityComplete =
    boatTypeKey.trim().length > 0 &&
    (values["manufacturer_brand"] ?? "").trim().length > 0 &&
    (values["model"] ?? "").trim().length > 0;
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

  // Sekme sırası ve index yardımcıları.
  const TAB_ID_ORDER = FEATURE_SUB_TABS.map((t) => t.id);
  const tabIndex = (id: FeatureSubTabId) => TAB_ID_ORDER.indexOf(id);
  const lastTabId = TAB_ID_ORDER[TAB_ID_ORDER.length - 1];

  // Ulaşılabilirlik artık tamamlanmaya değil, "Kaydet & Devam" ile ulaşılan en
  // ileri sekmeye (maxReachedTab) bağlı. Geri/aynı sekmeler serbest, ileri kilitli.
  const tabReachable: Record<FeatureSubTabId, boolean> = {
    identity: tabIndex("identity") <= tabIndex(maxReachedTab),
    specs: tabIndex("specs") <= tabIndex(maxReachedTab),
    engine: tabIndex("engine") <= tabIndex(maxReachedTab),
    cabins: tabIndex("cabins") <= tabIndex(maxReachedTab),
  };
  const TAB_LOCK_HINT: Record<FeatureSubTabId, string> = {
    identity: "",
    specs: 'Bu bölüme geçmek için önce "Tekne Kimliği" adımını "Kaydet & Devam" ile tamamlayın.',
    engine: 'Bu bölüme geçmek için önce "Tekne Özellikleri" adımını "Kaydet & Devam" ile tamamlayın.',
    cabins: 'Bu bölüme geçmek için önce "Motor" adımını "Kaydet & Devam" ile tamamlayın.',
  };
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

  // Kayıtlı tekne verisiyle geri dönen kullanıcılar tamamladıkları sekmelerde
  // serbestçe gezebilsin diye maxReachedTab'ı ilk render'da bir kez ayarla.
  // Bundan sonra ilerleme yalnızca "Kaydet & Devam" butonuyla olur.
  useEffect(() => {
    if (didInitReached.current) return;
    didInitReached.current = true;
    let reached: FeatureSubTabId = "identity";
    if (identityComplete) reached = "specs";
    if (identityComplete && specsComplete) reached = "engine";
    if (identityComplete && specsComplete && engineComplete) reached = "cabins";
    if (reached !== "identity") {
      setMaxReachedTab(reached);
      setActiveTab(reached);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // İlerleme: mevcut sekmeyi taslak olarak kaydet ve bir sonraki alt sekmeye geç.
  const advanceToNextTab = useCallback(() => {
    const next = TAB_ID_ORDER[tabIndex(activeTab) + 1];
    if (!next) return;
    void flushFeaturesDraft();
    setMaxReachedTab((m) => (tabIndex(next) > tabIndex(m) ? next : m));
    setActiveTab(next);
    setTabWarning(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, flushFeaturesDraft]);

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
          <Button size="lg"
            disabled={
              busy ||
              !boatTypeKey ||
              !hasListingModels ||
              // Aktif sekmenin zorunlu alanları dolmadan devam edilemez.
              // Kabin + Tuvalet son sekme; tam doğrulama kaydetme anında çalışır.
              (activeTab !== lastTabId && !tabComplete[activeTab])
            }
            onClick={() => {
              // Ara sekmelerde: taslağı kaydet ve bir sonraki alt sekmeye geç.
              if (activeTab !== lastTabId) {
                advanceToNextTab();
                return;
              }
              // Son sekmede: tam doğrulama + kayıt, ardından sonraki adıma geç.
              run(save, {
                onValidation: (errors) => {
                  const tab = firstSubTabWithErrors(errors);
                  if (tab) {
                    setMaxReachedTab((m) => (tabIndex(tab) > tabIndex(m) ? tab : m));
                    setActiveTab(tab);
                  }
                },
              });
            }}
          >
            <SaveLabel busy={busy} />
          </Button>
        </>
      }
    >
      {/* "X alan kontrol edilmeli" banner'ı hiçbir durumda gösterilmez; hatalar
          yalnızca ilgili alanın altında inline gösteriliyor ve hatalı sekme
          kırmızı nokta ile işaretleniyor. */}
      {!hasListingModels ? (
        <Alert variant="info">Önce 1. adımda kiralama modeli seçmelisin.</Alert>
      ) : null}

      <div>
        <SubStepTabs
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
            ) : // Ulaşılmış, aktif olmayan ve tamamlanmış önceki sekmelerde yeşil tik.
            t.id !== activeTab && tabComplete[t.id] ? (
              <FontAwesomeIcon
                icon={faCheck}
                className="text-[11px] text-success-600"
                aria-label="Tamamlandı"
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
        ) : null}
      </div>

      {activeTab === "identity" ? (
        <section className="space-y-8">
          <div data-field="boatTypeKey">
            <SectionTitle hint="Teknenin tipini, markasını ve modelini seç. Bu bilgiler ilanının kimliğini oluşturur.">
              Teknenizi en iyi hangisi tanımlıyor?
              <span className="ml-0.5 text-danger-500" aria-hidden>
                *
              </span>
            </SectionTitle>
            <ChoiceTiles
              ariaLabel="Tekne tipi"
              error={!!fieldErrors.boatTypeKey}
              value={boatTypeKey}
              onChange={(v) => {
                setBoatTypeKey(v);
                clearFieldError("boatTypeKey");
              }}
              options={config.boatTypes.map((t) => ({ value: t.key, label: t.label }))}
            />
            {fieldErrors.boatTypeKey ? (
              <p className="mt-2 text-caption text-danger-600">{fieldErrors.boatTypeKey}</p>
            ) : null}
          </div>

          <div className="space-y-5 border-t border-gray-200 pt-8">
            <SectionTitle>Marka ve model</SectionTitle>
            <BrandModelFields
              boatTypeKey={boatTypeKey}
              values={values}
              isGulet={isGuletBoatType(boatTypeKey)}
              fieldErrors={fieldErrors}
              onChange={updateValue}
              onPendingRequestChange={(req) => {
                pendingBrandRequestRef.current = req;
              }}
            />
          </div>
        </section>
      ) : null}

      {activeTab === "specs" ? (
        <p className="text-[14px] leading-relaxed text-gray-500">{SPECS_NUMERIC_HINT}</p>
      ) : null}

      {activeTab === "engine" ? (
        <div data-field="engineType">
          <SectionTitle>Motor tipi</SectionTitle>
          <ChoiceTiles<EngineType>
            ariaLabel="Motor tipi"
            error={!!fieldErrors.engineType}
            value={engineType}
            onChange={(v) => {
              setEngineType(v);
              clearFieldError("engineType");
            }}
            options={Object.values(EngineType).map((type) => ({
              value: type,
              label: ENGINE_TYPE_LABELS[type],
            }))}
          />
          {fieldErrors.engineType ? (
            <p className="mt-2 text-caption text-danger-600">{fieldErrors.engineType}</p>
          ) : null}
        </div>
      ) : null}

      {activeTab === "cabins" ? (
        <>
          <p className="text-[14px] leading-relaxed text-gray-500">{CABINS_REQUIRED_HINT}</p>
          <CrewFieldsSection
            values={values}
            noCrewMembers={noCrewMembers}
            fieldErrors={fieldErrors}
            requiredKeys={requiredFeatureKeys}
            onChange={updateValue}
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
        onChange={updateValue}
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

/** Donanım kategori anahtarlarının Türkçe etiketleri. */
const AMENITY_CATEGORY_LABELS_TR: Record<string, string> = {
  interior_equipment: "İç Donanım",
  kitchen_equipment: "Mutfak",
  other_amenities: "Diğer",
  entertainment: "Eğlence",
  security: "Güvenlik",
  navigation: "Seyir",
  deck: "Güverte",
};

function amenityCategoryLabel(key: string, fallback: string): string {
  return AMENITY_CATEGORY_LABELS_TR[key] ?? fallback;
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

  // Sayfa kaydırıldıkça üstteki kategori çipi görünür bölümü takip eder.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || categories.length < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveCategory(visible.target.id.replace("amenity-cat-", ""));
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    for (const c of categories) {
      const el = document.getElementById(`amenity-cat-${c.key}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [categories]);
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
          <Button size="lg"
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
      ) : null}
      {config.amenityCategories.length === 0 && boat.listingModels.length > 0 ? (
        <Alert variant="info">Bu kiralama modeli için donanım listesi yok.</Alert>
      ) : null}

      {categories.length > 1 ? (
        <nav
          aria-label="Donanım kategorileri"
          className="sticky top-[68px] z-20 -mx-5 flex gap-2 overflow-x-auto border-b border-gray-100 bg-white/95 px-5 py-3 backdrop-blur [scrollbar-width:none] sm:top-[76px] sm:-mx-1 sm:px-1 [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((c) => {
            const count = c.amenities.filter(
              (a) => state[a.key]?.included || state[a.key]?.isExtra
            ).length;
            const hasError = !!categoryErrorCounts[c.key];
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  setActiveCategory(c.key);
                  document
                    .getElementById(`amenity-cat-${c.key}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold transition",
                  activeCategory === c.key
                    ? "border-ink bg-ink text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-ink"
                )}
              >
                {amenityCategoryLabel(c.key, c.label)}
                {count > 0 ? (
                  <span
                    className={cn(
                      "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold",
                      activeCategory === c.key ? "bg-white/20 text-white" : "bg-brand-50 text-brand-600"
                    )}
                  >
                    {count}
                  </span>
                ) : null}
                {hasError ? (
                  <span
                    className="inline-flex h-2 w-2 rounded-full bg-danger-500"
                    aria-label={`${categoryErrorCounts[c.key]} hatalı donanım`}
                  />
                ) : null}
              </button>
            );
          })}
        </nav>
      ) : null}

      {categories.map((cat) => (
        <section key={cat.key} id={`amenity-cat-${cat.key}`} className="scroll-mt-40 sm:scroll-mt-44">
          <SectionTitle>{amenityCategoryLabel(cat.key, cat.label)}</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cat.amenities.map((a) => {
              const st = state[a.key] ?? {
                included: false,
                isExtra: false,
                extraPrice: "",
              };
              const isChecked = st.included || st.isExtra;
              const allowExtra = a.canBeExtra && amenityCategoryAllowsExtra(cat.key);
              const hasError = !!fieldErrors[a.key];
              const toggleCard = () =>
                set(a.key, {
                  included: !isChecked,
                  isExtra: !isChecked ? st.isExtra : false,
                });
              return (
                <div
                  key={a.key}
                  data-field={a.key}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onClick={toggleCard}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleCard();
                    }
                  }}
                  className={cn(
                    tileClass(isChecked, hasError),
                    "flex min-h-[76px] cursor-pointer select-none flex-col justify-center py-3.5 pl-4 pr-9"
                  )}
                >
                  <p className="text-[14.5px] font-semibold leading-snug">
                    {getFieldLabel(a)}
                    {requiredAmenityKeys.includes(a.key) ? (
                      <span className="ml-0.5 text-danger-500" aria-hidden>
                        *
                      </span>
                    ) : null}
                  </p>
                  <TileCheck on={isChecked} />

                  {isChecked && allowExtra ? (
                    <div
                      className="mt-2 flex flex-wrap items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={st.isExtra}
                          onChange={(e) => set(a.key, { isExtra: e.target.checked })}
                          className="h-3.5 w-3.5 accent-brand-500"
                        />
                        <span className="text-xs font-medium text-gray-600">Ekstra ücretli</span>
                      </label>
                      {st.isExtra ? (
                        <div className="flex items-center gap-1" data-field={`${a.key}-price`}>
                          <span className="text-xs text-gray-500">₺</span>
                          <input
                            type="number"
                            min={1}
                            placeholder="0"
                            value={st.extraPrice}
                            onChange={(e) => set(a.key, { extraPrice: e.target.value })}
                            aria-label={`${getFieldLabel(a)} ekstra ücreti`}
                            className={cn(
                              "w-20 rounded-lg border bg-white px-2 py-1 text-xs text-ink focus:outline-none",
                              hasError
                                ? "border-danger-400 focus:border-danger-500"
                                : "border-gray-300 focus:border-brand-500"
                            )}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {hasError ? (
                    <p className="mt-1 text-caption text-danger-600">{fieldErrors[a.key]}</p>
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
            <Button size="lg"
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
                  {amenityCategoryLabel(cat.key, cat.label)}
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

  const [knownLocations, setKnownLocations] = useState<string[]>([]);
  useEffect(() => {
    api.getLocationSuggestions().then(setKnownLocations).catch(() => {});
  }, []);

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
          <Button size="lg"
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
        mapboxToken={mapboxToken}
        value={pickerValue}
        knownLocations={knownLocations}
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
        <div className="space-y-5 border-t border-gray-200 pt-8">
          <SectionTitle>Adres bilgileri</SectionTitle>
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
      "inline-flex h-10 min-w-[76px] items-center justify-center gap-1.5 rounded-full border px-4 text-[14px] font-semibold transition-all",
      active
        ? tone === "yes"
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-ink bg-ink text-white"
        : "border-gray-300 bg-white text-gray-600 hover:border-ink hover:text-ink"
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
          <Button size="lg" disabled={busy || !canSave} onClick={() => run(save)}>
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
          <SectionTitle>İlan Başlığı ve Açıklaması</SectionTitle>
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
          (hasTitle || hasDescription) && "border-t border-gray-200 pt-8"
        )}
      >
        <SectionTitle
          optional
          hint="Misafirler için geçerli kuralları belirt. Her kural için Evet ya da Hayır seçebilirsin; hiçbirini seçmeden de devam edebilirsin."
        >
          Tekne Kuralları
        </SectionTitle>
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {BOAT_RULE_TOGGLES.map((r) => (
            <div
              key={r.key}
              data-field={r.key}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <span className="text-[15px] font-medium text-ink">{r.label}</span>
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

function PhotoTile({
  photo,
  busy,
  onMakeCover,
  onRemove,
}: {
  photo: SerializedBoat["photos"][number];
  busy: boolean;
  onMakeCover?: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100",
        photo.isCover && "col-span-2"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.publicUrl ?? ""}
        alt={photo.altText ?? ""}
        className={cn("w-full object-cover", photo.isCover ? "aspect-[16/9]" : "aspect-[4/3]")}
      />
      {photo.isCover ? (
        <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-[12.5px] font-semibold text-brand-600 shadow-sm">
          Kapak fotoğrafı
        </span>
      ) : null}
      <div ref={ref} className="absolute right-3 top-3">
        <button
          type="button"
          aria-label="Fotoğraf seçenekleri"
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={busy}
          onClick={() => setOpen((o) => !o)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-white disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faEllipsis} className="text-[15px]" aria-hidden />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-11 z-10 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-modal"
          >
            {onMakeCover ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onMakeCover();
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-[14px] font-medium text-ink hover:bg-gray-50"
              >
                Kapak yap
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onRemove();
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-[14px] font-medium text-danger-600 hover:bg-danger-50"
            >
              Sil
            </button>
          </div>
        ) : null}
      </div>
    </figure>
  );
}

export function PhotosStep({ boat, config, reload, goBack, onSaved }: StepProps) {
  const [uploadBusy, setUploadBusy] = useState(false);
  const { busy: saveBusy, errorSummary, run } = useStepSaver(onSaved);
  const busy = uploadBusy || saveBusy;
  const [error, setError] = useState<string | null>(null);
  const photoFields = getConfigFieldsForStep(config, OnboardingStep.PHOTOS);
  const boatPlanUrl = boat.features.find((f) => f.key === "boat_plan")?.value ?? null;

  async function onFiles(files: File[] | null) {
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

  // Kapak her zaman ilk ve geniş gösterilir (yalnızca görünüm sırası).
  const orderedPhotos = [
    ...boat.photos.filter((p) => p.isCover),
    ...boat.photos.filter((p) => !p.isCover),
  ];

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
          <Button size="lg"
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

      {orderedPhotos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {orderedPhotos.map((p) => (
            <PhotoTile
              key={p.id}
              photo={p}
              busy={busy}
              onMakeCover={p.isCover ? undefined : () => void makeCover(p.id)}
              onRemove={() => void remove(p.id)}
            />
          ))}
        </div>
      ) : null}

      <UploadDropzone
        accept="image/*"
        multiple
        busy={uploadBusy}
        disabled={busy}
        compact={orderedPhotos.length > 0}
        title={orderedPhotos.length > 0 ? "Daha fazla fotoğraf ekle" : "Fotoğraflarını buraya sürükle"}
        hint={
          orderedPhotos.length > 0
            ? "Birden fazla fotoğrafı aynı anda seçebilirsin."
            : "Ya da bilgisayarından seç. İlk yüklenen fotoğraf kapak olur; sonradan değiştirebilirsin."
        }
        buttonLabel="Fotoğraf seç"
        onFiles={(files) => void onFiles(files)}
      />

      {photoFields.some((f) => f.key === "boat_plan") ? (
        <section className="space-y-4 border-t border-gray-200 pt-8">
          <SectionTitle
            optional
            hint="İstersen tekne planını PDF veya görsel olarak yükleyebilirsin — yüklemeden de devam edebilirsin."
          >
            Tekne planı
          </SectionTitle>
          {boatPlanUrl ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
              <a
                href={boatPlanUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-brand-600 underline-offset-4 hover:underline"
              >
                Yüklenen planı görüntüle
              </a>
              <button
                type="button"
                onClick={() => removeBoatPlan()}
                disabled={busy}
                className="text-[13px] font-semibold text-danger-600 hover:underline disabled:opacity-50"
              >
                Sil
              </button>
            </div>
          ) : null}
          <UploadDropzone
            accept="image/*,.pdf"
            compact
            disabled={busy}
            title={boatPlanUrl ? "Planı değiştir" : "Tekne planını yükle"}
            hint="PDF, JPG veya PNG"
            onFiles={(files) => {
              const f = files[0];
              if (f) void uploadBoatPlan(f);
            }}
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
          <Button size="lg" disabled={busy || hasTimeOrderError} onClick={() => run(save)}>
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
        <SectionTitle hint={PRICING_REQUIRED_HINT}>Temel Fiyatlandırma</SectionTitle>
        <div className="space-y-4 rounded-card border border-gray-200 p-5">
          <h3 className="text-[15px] font-bold text-ink">Kiralama fiyatları</h3>
          {models.map((m) => (
            <div key={m.key} data-field={m.key}>
              <Field
                label={getListingModelPriceLabel(m.key, m.label)}
                required
                error={fieldErrors[m.key]}
              >
                <div className="relative max-w-[260px]">
                  <Input
                    type="number"
                    min={0}
                    value={prices[m.key] ?? ""}
                    error={!!fieldErrors[m.key]}
                    onChange={(e) => setPrices((p) => ({ ...p, [m.key]: e.target.value }))}
                    placeholder="0"
                    className="pr-10 font-semibold"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-gray-400">
                    ₺
                  </span>
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
        <section className="space-y-6 border-t border-gray-200 pt-8 [&_input]:text-[16px] [&_label]:text-[15px] [&_label]:text-gray-900 [&_select]:text-[16px] [&_textarea]:text-[16px]">
          <SectionTitle hint="Her hizmet için fiyata dahil olup olmadığını, dahil değilse tahmini ücreti belirt.">
            Ek Hizmetler ve Ücretler
          </SectionTitle>
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

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "İnceleniyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
};

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
          <Button size="lg"
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
      <div className="space-y-4">
        {documentTypes.map((dt) => {
          const docs = boat.documents.filter((d) => d.documentTypeKey === dt.key);
          const uploading = busyKey === dt.key;
          return (
            <section
              key={dt.key}
              className={cn(
                "rounded-card border p-5 transition-colors",
                docs.length > 0 ? "border-green-200 bg-green-50/40" : "border-gray-200 bg-white"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                      docs.length > 0 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    <FontAwesomeIcon icon={docs.length > 0 ? faCheck : faFileLines} className="text-[15px]" aria-hidden />
                  </span>
                  <h3 className="min-w-0 text-[15.5px] font-bold text-ink">
                    {dt.label}
                    {dt.required ? <span className="text-danger-500"> *</span> : null}
                  </h3>
                </div>
                <label
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-[13.5px] font-semibold text-ink transition hover:border-ink",
                    uploading && "pointer-events-none opacity-60"
                  )}
                >
                  {uploading ? <Spinner /> : <FontAwesomeIcon icon={faCloudArrowUp} className="text-[13px]" aria-hidden />}
                  {uploading ? "Yükleniyor…" : docs.length > 0 ? "Yeni dosya ekle" : "Dosya yükle"}
                  <input
                    type="file"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(dt.key, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {docs.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {docs.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm"
                    >
                      <span className="min-w-0 truncate text-gray-700">
                        {d.publicUrl ? (
                          <a
                            href={d.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-brand-600 underline-offset-4 hover:underline"
                          >
                            {d.fileName}
                          </a>
                        ) : (
                          <span className="font-semibold">{d.fileName}</span>
                        )}
                        <span className="ml-2 text-[12.5px] text-gray-400">
                          {DOCUMENT_STATUS_LABELS[d.status] ?? d.status}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(d.id)}
                        disabled={busyKey === d.id}
                        className="shrink-0 text-[13px] font-semibold text-danger-600 hover:underline disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
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
          <Button size="lg"
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
