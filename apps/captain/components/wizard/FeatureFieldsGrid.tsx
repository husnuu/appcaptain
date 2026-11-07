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
import { NumberStepper } from "./NumberStepper";
import { CounterRow, SectionTitle } from "./focus";
import { HourFieldSelect, UnitFieldInput } from "./UnitFieldInput";
import type { FieldErrorsMap } from "@getyourboat/shared";

const CREW_INCLUDED_FIELD_KEY = "crew_members_included_in_the_price";

/** Count fields that use a +/- stepper (years/measures stay as plain inputs). */
function isCountField(key: string): boolean {
  return key === "capacity" || NUMERIC_CABIN_FIELD_KEYS.has(key);
}

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
    <section>
      <SectionTitle>Mürettebat</SectionTitle>
      <Checkbox
        label="Mürettebat yok / bilmiyorum"
        checked={noCrewMembers ?? false}
        onChange={(e) => {
          onNoCrewMembersChange?.(e.target.checked);
          if (e.target.checked) onChange(CREW_FIELD_KEY, "0");
        }}
      />
      <div className="mt-2 divide-y divide-gray-200">
        <div data-field={CREW_FIELD_KEY}>
          <CounterRow
            label="Toplam Mürettebat Sayısı"
            required={requiredKeys?.has(CREW_FIELD_KEY) ?? false}
            error={crewError}
          >
            {noCrewMembers ? (
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Örn. 2"
                value={values[CREW_FIELD_KEY] ?? ""}
                disabled
                error={!!crewError}
                onChange={(e) => onChange(CREW_FIELD_KEY, e.target.value)}
                className="w-24 text-center"
                aria-label="Toplam Mürettebat Sayısı"
              />
            ) : (
              <NumberStepper
                value={values[CREW_FIELD_KEY] ?? ""}
                min={0}
                error={!!crewError}
                ariaLabel="Toplam Mürettebat Sayısı"
                onChange={(v) => onChange(CREW_FIELD_KEY, v)}
              />
            )}
          </CounterRow>
        </div>
        <div data-field={CREW_INCLUDED_FIELD_KEY}>
          <CounterRow
            label="Fiyata Dahil Mürettebat Sayısı"
            required={requiredKeys?.has(CREW_INCLUDED_FIELD_KEY) ?? false}
            error={crewIncludedError}
          >
            <NumberStepper
              value={values[CREW_INCLUDED_FIELD_KEY] ?? ""}
              min={0}
              error={!!crewIncludedError}
              ariaLabel="Fiyata Dahil Mürettebat Sayısı"
              onChange={(v) => onChange(CREW_INCLUDED_FIELD_KEY, v)}
            />
          </CounterRow>
        </div>
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

        // Alan sırası korunur; art arda gelen sayaç alanları tek bir çizgili liste olur.
        const blocks: { kind: "count" | "field"; key: string; node: React.ReactNode }[] = [];
        for (const f of features) {
          if (hideFuelFields && FUEL_FIELDS_HIDDEN_FOR_ENGINE.has(f.key)) continue;
          const fieldError = fieldErrors?.[f.key];
          const isRequired = requiredKeys?.has(f.key) ?? false;

          if (f.key === HULL_MATERIAL_FIELD_KEY) {
            blocks.push({
              kind: "field",
              key: f.key,
              node: (
                <FieldShell key={f.key} fieldKey={f.key}>
                  <Field label={getFieldLabel(f)} required={isRequired} error={fieldError}>
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
              ),
            });
            continue;
          }

          if (f.key === FUEL_TYPE_FIELD_KEY) {
            const fuelValue = normalizeFuelType(values[f.key] ?? "");
            blocks.push({
              kind: "field",
              key: f.key,
              node: (
                <FieldShell key={f.key} fieldKey={f.key}>
                  <Field label={getFieldLabel(f)} required={isRequired} error={fieldError}>
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
              ),
            });
            continue;
          }

          if (isUnitFieldKey(f.key)) {
            blocks.push({
              kind: "field",
              key: f.key,
              node: (
                <FieldShell key={f.key} fieldKey={f.key}>
                  <UnitFieldInput
                    fieldKey={f.key}
                    label={getFieldLabel(f)}
                    values={values}
                    error={fieldError}
                    onChange={(next) => {
                      const keys = new Set([f.key, `${f.key}_unit`, `${f.key}_raw`]);
                      for (const key of keys) {
                        const v = next[key] ?? "";
                        if ((values[key] ?? "") !== v) onChange(key, v);
                      }
                    }}
                  />
                </FieldShell>
              ),
            });
            continue;
          }

          if (isHourFieldKey(f.key)) {
            blocks.push({
              kind: "field",
              key: f.key,
              node: (
                <FieldShell key={f.key} fieldKey={f.key}>
                  <HourFieldSelect
                    fieldKey={f.key}
                    label={getFieldLabel(f)}
                    value={values[f.key] ?? ""}
                    error={fieldError}
                    onChange={onChange}
                  />
                </FieldShell>
              ),
            });
            continue;
          }

          if (isCountField(f.key)) {
            blocks.push({
              kind: "count",
              key: f.key,
              node: (
                <FieldShell key={f.key} fieldKey={f.key}>
                  <CounterRow label={getFieldLabel(f)} required={isRequired} error={fieldError}>
                    <NumberStepper
                      value={values[f.key] ?? ""}
                      min={0}
                      error={!!fieldError}
                      ariaLabel={getFieldLabel(f)}
                      onChange={(v) => onChange(f.key, v)}
                    />
                  </CounterRow>
                </FieldShell>
              ),
            });
            continue;
          }

          const isNumeric =
            NUMERIC_SPEC_FIELD_KEYS.has(f.key) || NUMERIC_CABIN_FIELD_KEYS.has(f.key);
          blocks.push({
            kind: "field",
            key: f.key,
            node: (
              <FieldShell key={f.key} fieldKey={f.key}>
                <Field label={getFieldLabel(f)} required={isRequired} error={fieldError}>
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
            ),
          });
        }

        // Art arda gelen sayaç alanlarını gruplayarak ekrana bas.
        const rendered: React.ReactNode[] = [];
        let counterRun: React.ReactNode[] = [];
        const flushCounters = (key: string) => {
          if (counterRun.length === 0) return;
          rendered.push(
            <div key={`counters-${key}`} className="divide-y divide-gray-200">
              {counterRun}
            </div>
          );
          counterRun = [];
        };
        blocks.forEach((b) => {
          if (b.kind === "count") {
            counterRun.push(b.node);
          } else {
            flushCounters(b.key);
            rendered.push(b.node);
          }
        });
        flushCounters("end");
        if (rendered.length === 0) return null;

        return (
          <section key={group.key} className="border-t border-gray-200 pt-8">
            <SectionTitle>{getFeatureGroupLabel(group.key, group.label)}</SectionTitle>
            <div className="space-y-5">{rendered}</div>
          </section>
        );
      })}
    </>
  );
}

export { SPECS_NUMERIC_HINT, CABINS_OPTIONAL_HINT, CABINS_REQUIRED_HINT };
