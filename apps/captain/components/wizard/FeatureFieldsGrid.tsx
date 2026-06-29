"use client";

import {
  CABINS_OPTIONAL_HINT,
  CABINS_REQUIRED_HINT,
  CREW_FIELD_KEY,
  FUEL_TYPE_FIELD_KEY,
  FUEL_TYPE_OPTIONS,
  NUMERIC_CABIN_FIELD_KEYS,
  NUMERIC_SPEC_FIELD_KEYS,
  SPECS_NUMERIC_HINT,
  EngineType,
  FUEL_FIELDS_HIDDEN_FOR_ENGINE,
  getFieldLabel,
  getFeatureGroupLabel,
  isHiddenFeatureField,
  isHourFieldKey,
  isUnitFieldKey,
  HULL_MATERIAL_FIELD_KEY,
  HULL_MATERIAL_OPTIONS,
} from "@getyourboat/shared";
import { Checkbox, Field, Input, Select } from "../ui";
import { isBrandModelFieldKey } from "./BrandModelFields";
import { HourFieldSelect, UnitFieldInput } from "./UnitFieldInput";
import type { FieldErrorsMap } from "@getyourboat/shared";

const CREW_INCLUDED_FIELD_KEY = "crew_members_included_in_the_price";

function FieldShell({
  fieldKey,
  children,
}: {
  fieldKey: string;
  children: React.ReactNode;
}) {
  return (
    <div key={fieldKey} data-field={fieldKey}>
      {children}
    </div>
  );
}

function normalizeFuelType(value: string): string {
  const v = value.trim().toLowerCase();
  if (v === "diesel" || v === "dizel") return "DIESEL";
  if (v === "gasoline" || v === "benzin" || v === "petrol") return "GASOLINE";
  if (v === "electric" || v === "elektrikli") return "ELECTRIC";
  if (v === "hybrid" || v === "hibrit") return "HYBRID";
  return value.toUpperCase();
}

export function CrewFieldsSection({
  values,
  noCrewMembers,
  onChange,
  onNoCrewMembersChange,
  fieldErrors,
  requiredKeys,
}: {
  values: Record<string, string>;
  noCrewMembers?: boolean;
  onChange: (key: string, value: string) => void;
  onNoCrewMembersChange?: (value: boolean) => void;
  fieldErrors?: FieldErrorsMap;
  requiredKeys?: ReadonlySet<string>;
}) {
  const crewError = fieldErrors?.[CREW_FIELD_KEY];
  const crewIncludedError = fieldErrors?.[CREW_INCLUDED_FIELD_KEY];
  return (
    <section className="space-y-4 border-b border-gray-100 pb-7">
      <h3 className="text-[15px] font-semibold text-ink">Mürettebat</h3>
      <Checkbox
        label="Mürettebat yok / bilmiyorum"
        checked={noCrewMembers ?? false}
        onChange={(e) => {
          onNoCrewMembersChange?.(e.target.checked);
          if (e.target.checked) onChange(CREW_FIELD_KEY, "0");
        }}
      />
      <div data-field={CREW_FIELD_KEY}>
        <Field
          label="Toplam Mürettebat Sayısı"
          required={requiredKeys?.has(CREW_FIELD_KEY) ?? false}
          error={crewError}
        >
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Örn. 2"
            value={values[CREW_FIELD_KEY] ?? ""}
            disabled={noCrewMembers}
            error={!!crewError}
            onChange={(e) => onChange(CREW_FIELD_KEY, e.target.value)}
          />
        </Field>
      </div>
      <div data-field={CREW_INCLUDED_FIELD_KEY}>
        <Field
          label="Fiyata Dahil Mürettebat Sayısı"
          required={requiredKeys?.has(CREW_INCLUDED_FIELD_KEY) ?? false}
          error={crewIncludedError}
        >
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Örn. 2"
            value={values[CREW_INCLUDED_FIELD_KEY] ?? ""}
            error={!!crewIncludedError}
            onChange={(e) => onChange(CREW_INCLUDED_FIELD_KEY, e.target.value)}
          />
        </Field>
      </div>
    </section>
  );
}

export function FeatureFieldsGrid({
  groups,
  values,
  onChange,
  engineType,
  excludeKeys = [],
  fieldErrors,
  requiredKeys,
}: {
  groups: { key: string; label: string; features: { key: string; label: string }[] }[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  engineType?: EngineType | null;
  excludeKeys?: string[];
  fieldErrors?: FieldErrorsMap;
  requiredKeys?: ReadonlySet<string>;
}) {
  const hideFuelFields = engineType === EngineType.SAIL_NO_ENGINE;
  const excluded = new Set([
    ...excludeKeys,
    CREW_FIELD_KEY,
    CREW_INCLUDED_FIELD_KEY,
  ]);

  return (
    <>
      {groups.map((group) => {
        const features = group.features.filter(
          (f) =>
            !isBrandModelFieldKey(f.key) &&
            !isHiddenFeatureField(f.key) &&
            !excluded.has(f.key)
        );
        if (features.length === 0) return null;

        return (
          <section key={group.key} className="space-y-4 border-t border-gray-100 pt-7">
            <h3 className="text-[15px] font-semibold text-ink">
              {getFeatureGroupLabel(group.key, group.label)}
            </h3>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {features.map((f) => {
                if (hideFuelFields && FUEL_FIELDS_HIDDEN_FOR_ENGINE.has(f.key)) return null;

                if (f.key === HULL_MATERIAL_FIELD_KEY) {
                  const fieldError = fieldErrors?.[f.key];
                  return (
                    <FieldShell key={f.key} fieldKey={f.key}>
                      <Field
                        label={getFieldLabel(f)}
                        required={requiredKeys?.has(f.key) ?? false}
                        error={fieldError}
                      >
                        <Select
                          value={values[f.key] ?? ""}
                          error={!!fieldError}
                          onChange={(e) => onChange(f.key, e.target.value)}
                        >
                          <option value="">Seçiniz…</option>
                          {HULL_MATERIAL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </FieldShell>
                  );
                }

                if (f.key === FUEL_TYPE_FIELD_KEY) {
                  const fuelValue = normalizeFuelType(values[f.key] ?? "");
                  const fieldError = fieldErrors?.[f.key];
                  return (
                    <FieldShell key={f.key} fieldKey={f.key}>
                      <Field
                        label={getFieldLabel(f)}
                        required={requiredKeys?.has(f.key) ?? false}
                        error={fieldError}
                      >
                        <Select
                          value={fuelValue}
                          error={!!fieldError}
                          onChange={(e) => onChange(f.key, e.target.value)}
                        >
                          <option value="">Seçiniz…</option>
                          {FUEL_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </FieldShell>
                  );
                }

                if (isUnitFieldKey(f.key)) {
                  return (
                    <FieldShell key={f.key} fieldKey={f.key}>
                      <UnitFieldInput
                        fieldKey={f.key}
                        label={getFieldLabel(f)}
                        values={values}
                        error={fieldErrors?.[f.key]}
                        onChange={(next) => {
                          const keys = new Set([f.key, `${f.key}_unit`, `${f.key}_raw`]);
                          for (const key of keys) {
                            const v = next[key] ?? "";
                            if ((values[key] ?? "") !== v) onChange(key, v);
                          }
                        }}
                      />
                    </FieldShell>
                  );
                }

                if (isHourFieldKey(f.key)) {
                  return (
                    <FieldShell key={f.key} fieldKey={f.key}>
                      <HourFieldSelect
                        fieldKey={f.key}
                        label={getFieldLabel(f)}
                        value={values[f.key] ?? ""}
                        error={fieldErrors?.[f.key]}
                        onChange={onChange}
                      />
                    </FieldShell>
                  );
                }

                const isNumeric =
                  NUMERIC_SPEC_FIELD_KEYS.has(f.key) || NUMERIC_CABIN_FIELD_KEYS.has(f.key);
                const fieldError = fieldErrors?.[f.key];
                const isRequired = requiredKeys?.has(f.key) ?? false;

                return (
                  <FieldShell key={f.key} fieldKey={f.key}>
                    <Field
                      label={getFieldLabel(f)}
                      required={isRequired}
                      error={fieldError}
                    >
                      <Input
                        type={isNumeric ? "number" : "text"}
                        min={isNumeric ? 0 : undefined}
                        inputMode={isNumeric ? "numeric" : undefined}
                        placeholder={isNumeric ? "0" : undefined}
                        value={values[f.key] ?? ""}
                        error={!!fieldError}
                        onChange={(e) => onChange(f.key, e.target.value)}
                      />
                    </Field>
                  </FieldShell>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

export { SPECS_NUMERIC_HINT, CABINS_OPTIONAL_HINT, CABINS_REQUIRED_HINT };
