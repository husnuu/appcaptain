"use client";

import {
  formatDailyAcUsage,
  formatMinRentalDuration,
  getFieldBehavior,
  getFieldLabel,
  getFieldsForWizardStep,
  getIncludedFeeGroup,
  INCLUDED_FEE_SKIP_KEYS,
  OnboardingStep,
  parseDailyAcUsage,
  parseMinRentalDuration,
  PRICING_FIELD_PLACEHOLDERS,
  readIncludedFeePair,
  TIME_FIELD_KEYS,
  toTimeInputValue,
  WEEKDAY_OPTIONS,
  writeIncludedFeePair,
  type FieldValueMap,
  type FieldErrorsMap,
  type OnboardingFieldDTO,
  type ResolvedOnboardingConfigDTO,
} from "@getyourboat/shared";
import type { OnboardingConfig } from "../../lib/types";
import { Checkbox, Field, Input, Select, Textarea } from "../ui";

export {
  FeatureFieldsGrid,
  CrewFieldsSection,
  SPECS_NUMERIC_HINT,
  CABINS_OPTIONAL_HINT,
  CABINS_REQUIRED_HINT,
} from "./FeatureFieldsGrid";

export function isResolvedConfig(
  config: OnboardingConfig
): config is ResolvedOnboardingConfigDTO {
  return "fields" in config && Array.isArray((config as ResolvedOnboardingConfigDTO).fields);
}

export function getConfigFieldsForStep(
  config: OnboardingConfig,
  step: OnboardingStep
): OnboardingFieldDTO[] {
  if (!isResolvedConfig(config)) return [];
  return getFieldsForWizardStep(config.fields, step);
}

/** İptal politikası seçenekleri + kaptana gösterilen açıklama metinleri. */
const CANCELLATION_POLICY_OPTIONS = [
  {
    value: "flexible",
    label: "Esnek",
    description:
      "Başlangıç tarihinden 1 gün öncesine kadar ücretsiz iptal. 1 günden az kaldığında ücretin %50'si iade edilir.",
  },
  {
    value: "moderate",
    label: "Orta",
    description:
      "Başlangıç tarihinden 5 gün öncesine kadar ücretsiz iptal. 5 günden az kaldığında ücretin %50'si iade edilir.",
  },
  {
    value: "strict",
    label: "Katı",
    description:
      "Başlangıç tarihinden 14 gün öncesine kadar ücretsiz iptal. 14 günden az kaldığında iade yapılmaz.",
  },
] as const;

function isBooleanField(field: OnboardingFieldDTO): boolean {
  return (
    field.type === "rule" ||
    (field.type === "booking_rule" &&
      ["alcohol_allowed", "outside_food_drink_allowed"].includes(field.key))
  );
}

function isLongTextField(field: OnboardingFieldDTO): boolean {
  return (
    field.key === "boat_rules_and_policies" ||
    field.key === "services_dj_photoshoot_decoration_birthday_laser_show_etc"
  );
}

function IncludedFeeField({
  group,
  values,
  onChange,
  fieldErrors,
  requiredKeys,
}: {
  group: NonNullable<ReturnType<typeof getIncludedFeeGroup>>;
  values: FieldValueMap;
  onChange: (key: string, value: string | boolean) => void;
  fieldErrors?: FieldErrorsMap;
  requiredKeys?: ReadonlySet<string>;
}) {
  const { mode, fee } = readIncludedFeePair(
    values,
    group.includedKey,
    group.notIncludedKey
  );
  const includedError = fieldErrors?.[group.includedKey];
  const notIncludedError = fieldErrors?.[group.notIncludedKey];
  const fieldError = includedError ?? notIncludedError;

  function setMode(next: "included" | "not_included" | "") {
    if (!next) {
      onChange(group.includedKey, "");
      onChange(group.notIncludedKey, "");
      return;
    }
    const patch = writeIncludedFeePair(next, fee, group.includedKey, group.notIncludedKey);
    onChange(group.includedKey, patch[group.includedKey] ?? "");
    onChange(group.notIncludedKey, patch[group.notIncludedKey] ?? "");
  }

  function setFee(nextFee: string) {
    const patch = writeIncludedFeePair(
      "not_included",
      nextFee,
      group.includedKey,
      group.notIncludedKey
    );
    onChange(group.includedKey, patch[group.includedKey] ?? "");
    onChange(group.notIncludedKey, patch[group.notIncludedKey] ?? "");
  }

  return (
    <div key={group.includedKey} data-field={group.includedKey} className="space-y-3">
      <Field
        label={group.label}
        hint={group.description}
        required={requiredKeys?.has(group.includedKey) ?? false}
        error={fieldError}
      >
        <Select
          value={mode}
          error={!!fieldError}
          onChange={(e) => setMode(e.target.value as "included" | "not_included" | "")}
        >
          <option value="">Seçiniz…</option>
          <option value="included">Fiyata dahil</option>
          <option value="not_included">Dahil değil (müşteri ayrıca öder)</option>
        </Select>
      </Field>
      {mode === "not_included" ? (
        <div data-field={group.notIncludedKey}>
          <Field label="Tahmini tutar (opsiyonel)" error={notIncludedError}>
            <Input
              value={fee}
              error={!!notIncludedError}
              onChange={(e) => setFee(e.target.value)}
              placeholder={group.feePlaceholder}
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}

function MinRentalDurationField({
  field,
  label,
  required,
  value,
  onChange,
  fieldError,
}: {
  field: OnboardingFieldDTO;
  label: string;
  required?: boolean;
  value: string;
  onChange: (key: string, value: string | boolean) => void;
  fieldError?: string;
}) {
  const parsed = parseMinRentalDuration(value);

  return (
    <div key={field.key} data-field={field.key}>
      <Field label={label} required={required} error={fieldError}>
        <div className="flex max-w-md items-center gap-2">
          <Input
            type="number"
            min={1}
            value={parsed.amount}
            error={!!fieldError}
            onChange={(e) =>
              onChange(field.key, formatMinRentalDuration(e.target.value, parsed.unit))
            }
            placeholder="3"
            className="w-24"
          />
          <Select
            value={parsed.unit}
            error={!!fieldError}
            onChange={(e) =>
              onChange(
                field.key,
                formatMinRentalDuration(parsed.amount, e.target.value as "gece" | "gün")
              )
            }
            className="w-28"
          >
            <option value="gece">gece</option>
            <option value="gün">gün</option>
          </Select>
        </div>
      </Field>
    </div>
  );
}

function DailyAcUsageField({
  field,
  label,
  required,
  value,
  onChange,
  fieldError,
}: {
  field: OnboardingFieldDTO;
  label: string;
  required?: boolean;
  value: string;
  onChange: (key: string, value: string | boolean) => void;
  fieldError?: string;
}) {
  const parsed = parseDailyAcUsage(value);

  return (
    <div key={field.key} data-field={field.key}>
      <Field label={label} required={required} error={fieldError}>
        <div className="flex max-w-md items-center gap-2">
          <Input
            type="number"
            min={0}
            value={parsed.hours}
            error={!!fieldError}
            onChange={(e) => onChange(field.key, formatDailyAcUsage(e.target.value))}
            placeholder="4"
            className="w-24"
          />
          <span className="text-sm text-slate-500">saat/gün</span>
        </div>
      </Field>
    </div>
  );
}

function isRequiredKey(key: string, requiredKeys?: ReadonlySet<string>): boolean {
  return requiredKeys?.has(key) ?? false;
}

export function DynamicOnboardingFields({
  fields,
  values,
  onChange,
  contactForFuelCost,
  onContactForFuelCostChange,
  fieldErrors,
  requiredKeys,
}: {
  fields: OnboardingFieldDTO[];
  values: FieldValueMap;
  onChange: (key: string, value: string | boolean) => void;
  contactForFuelCost?: boolean;
  onContactForFuelCostChange?: (value: boolean) => void;
  fieldErrors?: FieldErrorsMap;
  requiredKeys?: ReadonlySet<string>;
}) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-5">
      {fields.map((field) => {
        const behavior = getFieldBehavior(field.key);
        if (!behavior.ownerInput) return null;
        if (INCLUDED_FEE_SKIP_KEYS.has(field.key)) return null;

        const includedFeeGroup = getIncludedFeeGroup(field.key);
        if (includedFeeGroup) {
          return (
            <IncludedFeeField
              key={field.key}
              group={includedFeeGroup}
              values={values}
              onChange={onChange}
              fieldErrors={fieldErrors}
              requiredKeys={requiredKeys}
            />
          );
        }

        const label = getFieldLabel(field);
        const required = isRequiredKey(field.key, requiredKeys);
        const fieldError = fieldErrors?.[field.key];
        const stringValue = String(values[field.key] ?? "");

        if (behavior.special === "fuel_contact_flag") {
          return (
            <div key={field.key} className="space-y-3 border-t border-gray-100 pt-5">
              <div data-field={field.key}>
                <Field label={label} required={required} error={fieldError}>
                  <Checkbox
                    label="Yakıt dahil değil — müşteri fiyat için bizimle iletişime geçsin"
                    checked={contactForFuelCost ?? false}
                    onChange={(e) => onContactForFuelCostChange?.(e.target.checked)}
                  />
                </Field>
              </div>
              {!contactForFuelCost ? (
                <div data-field={field.key}>
                  <Field label="Yakıt maliyeti açıklaması" error={fieldError}>
                    <Input
                      value={stringValue}
                      error={!!fieldError}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      placeholder="Örn. saatlik yakıt tüketimi / ücret"
                    />
                  </Field>
                </div>
              ) : null}
            </div>
          );
        }

        if (isBooleanField(field)) {
          const checked = values[field.key] === true || values[field.key] === "true";
          return (
            <div key={field.key} data-field={field.key}>
              <Field label={label} required={required} error={fieldError}>
                <Checkbox
                  label="Evet"
                  checked={checked}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                />
              </Field>
            </div>
          );
        }

        if (
          field.key === "description" ||
          (field.type === "media_description" && field.key === "description")
        ) {
          return (
            <div key={field.key} data-field={field.key}>
              <Field label={label} required={required} error={fieldError}>
                <Textarea
                  rows={5}
                  value={stringValue}
                  error={!!fieldError}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              </Field>
            </div>
          );
        }

        if (isLongTextField(field)) {
          return (
            <div key={field.key} data-field={field.key}>
              <Field label={label} required={required} error={fieldError}>
                <Textarea
                  rows={4}
                  value={stringValue}
                  error={!!fieldError}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  placeholder={PRICING_FIELD_PLACEHOLDERS[field.key]}
                />
              </Field>
            </div>
          );
        }

        if (field.key === "cancellation_policy" || field.key === "deposit_type_payment_before") {
          const isCancellation = field.key === "cancellation_policy";
          return (
            <div key={field.key} data-field={field.key}>
              <Field label={label} required={required} error={fieldError}>
                <Select
                  value={stringValue}
                  error={!!fieldError}
                  onChange={(e) => onChange(field.key, e.target.value)}
                >
                  <option value="">Seçiniz…</option>
                  {isCancellation ? (
                    CANCELLATION_POLICY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="percent_20">%20 ön ödeme</option>
                      <option value="percent_50">%50 ön ödeme</option>
                      <option value="full">Tam ödeme</option>
                    </>
                  )}
                </Select>
              </Field>
              {isCancellation ? (
                <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-gray-500">
                  {CANCELLATION_POLICY_OPTIONS.map((o) => (
                    <li
                      key={o.value}
                      className={stringValue === o.value ? "text-gray-700" : undefined}
                    >
                      <span className="font-medium text-gray-600">{o.label}:</span>{" "}
                      {o.description}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        }

        if (TIME_FIELD_KEYS.has(field.key)) {
          return (
            <div key={field.key} data-field={field.key}>
              <Field label={label} required={required} error={fieldError}>
                <Input
                  type="time"
                  value={toTimeInputValue(stringValue)}
                  error={!!fieldError}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="max-w-[160px]"
                />
              </Field>
            </div>
          );
        }

        if (field.key === "min_rental_duration") {
          return (
            <MinRentalDurationField
              key={field.key}
              field={field}
              label={label}
              required={required}
              value={stringValue}
              onChange={onChange}
              fieldError={fieldError}
            />
          );
        }

        if (field.key === "weekly_check_in_out_day") {
          return (
            <div key={field.key} data-field={field.key}>
              <Field label={label} required={required} error={fieldError}>
                <Select
                  value={stringValue}
                  error={!!fieldError}
                  onChange={(e) => onChange(field.key, e.target.value)}
                >
                  <option value="">Seçiniz…</option>
                  {WEEKDAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          );
        }

        if (field.key === "daily_a_c_usage") {
          return (
            <DailyAcUsageField
              key={field.key}
              field={field}
              label={label}
              required={required}
              value={stringValue}
              onChange={onChange}
              fieldError={fieldError}
            />
          );
        }

        return (
          <div key={field.key} data-field={field.key}>
            <Field label={label} required={required} error={fieldError}>
              <Input
                value={stringValue}
                error={!!fieldError}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={PRICING_FIELD_PLACEHOLDERS[field.key]}
              />
            </Field>
          </div>
        );
      })}
    </div>
  );
}
