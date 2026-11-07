"use client";

import type { ValidationFieldError } from "@getyourboat/shared";
import { useEffect, useRef, type ReactNode } from "react";
import { Alert, Field, Label, Textarea } from "../ui";
import {
  WizardBackButton,
  WizardFooterBar,
  WizardHeading,
  useWizardChrome,
} from "../wizard/focus";

/** Textarea where each non-empty line becomes a list item. */
export function LinesField({
  label,
  hint,
  value,
  onChange,
  rows = 4,
  required,
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (value: string[]) => void;
  rows?: number;
  required?: boolean;
}) {
  const text = value.join("\n");
  return (
    <Field>
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      {hint ? <p className="mb-1 text-xs text-gray-500">{hint}</p> : null}
      <Textarea
        rows={rows}
        value={text}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const lines = e.target.value
            .split("\n")
            .map((l: string) => l.trim())
            .filter(Boolean);
          onChange(lines);
        }}
        placeholder="Her satıra bir madde yazın"
      />
    </Field>
  );
}

export function StepShell({
  title,
  description,
  children,
  error,
  fieldErrors,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  error?: string | null;
  fieldErrors?: ValidationFieldError[];
  /** Alt çubuğun sağ tarafı (Devam et / İncelemeye gönder). */
  footer?: ReactNode;
}) {
  const { onBack } = useWizardChrome();
  const hasFieldErrors = !!fieldErrors && fieldErrors.length > 0;
  const alertRef = useRef<HTMLDivElement>(null);

  // Alttaki butondan sonra oluşan hatayı görünür yap.
  useEffect(() => {
    if (hasFieldErrors || error) {
      alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [hasFieldErrors, error, fieldErrors]);

  return (
    <div>
      <WizardHeading title={title} description={description} />
      {hasFieldErrors || error ? (
        <div ref={alertRef} className="mb-8">
          {hasFieldErrors ? (
            <Alert variant="danger">
              <div>
                <p className="font-medium">Lütfen aşağıdaki alanları düzeltin:</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {fieldErrors!.map((f) => (
                    <li key={f.field}>{f.message}</li>
                  ))}
                </ul>
              </div>
            </Alert>
          ) : (
            <Alert variant="danger">{error}</Alert>
          )}
        </div>
      ) : null}
      <div className="space-y-7">{children}</div>
      <WizardFooterBar>
        {onBack ? <WizardBackButton onClick={onBack} /> : <span />}
        {footer}
      </WizardFooterBar>
    </div>
  );
}
