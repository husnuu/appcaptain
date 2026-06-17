"use client";

import { Field, Input, Select, Textarea } from "@getyourboat/ui";
import type { EditBoatFieldDef } from "../../../lib/mock/boat.mock";

interface FormGridProps {
  fields: EditBoatFieldDef[];
  values: Record<string, string>;
  errors?: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

/**
 * Generic 2-column form grid driven by field definitions. Composes only the
 * shared ui primitives (Field/Input/Select/Textarea) — no one-off styling.
 */
export function FormGrid({ fields, values, errors, onChange }: FormGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.key] ?? "";
        const error = errors?.[field.key];
        const label = field.required ? `${field.label} *` : field.label;

        let control: React.ReactNode;
        if (field.type === "select") {
          control = (
            <Select
              value={value}
              error={!!error}
              onChange={(e) => onChange(field.key, e.target.value)}
            >
              <option value="">Seç…</option>
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          );
        } else if (field.type === "textarea") {
          control = (
            <Textarea
              value={value}
              error={!!error}
              placeholder={field.placeholder}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          );
        } else {
          const input = (
            <Input
              type={field.type === "number" ? "number" : "text"}
              value={value}
              error={!!error}
              placeholder={field.placeholder}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          );
          control = field.unit ? (
            <div className="flex gap-2">
              {input}
              <span className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-100 px-3 text-body-sm text-gray-600">
                {field.unit}
              </span>
            </div>
          ) : (
            input
          );
        }

        return (
          <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
            <Field label={label} error={error}>
              {control}
            </Field>
          </div>
        );
      })}
    </div>
  );
}
