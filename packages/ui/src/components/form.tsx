import * as React from "react";
import { cn } from "../lib/cn";
import { FontAwesomeIcon, faChevronDown, type IconDefinition } from "../icons";

/**
 * Form controls. Border 1px gray-300, focus ring 2px Brand Orange, error state
 * uses danger border + a 12px caption-sized red message. All forms validate
 * with the shared Zod schemas; error text is rendered here, not inline.
 */

const base =
  "w-full rounded-xl border bg-white text-body-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:ring-4 disabled:opacity-60 disabled:bg-gray-100";
const ok = "border-gray-200 focus:border-brand-500 focus:ring-brand-500/15";
const bad = "border-danger-500 focus:border-danger-500 focus:ring-danger-500/15";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(base, "h-12 px-3.5", error ? bad : ok, className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(base, "min-h-[96px] px-3.5 py-2.5", error ? bad : ok, className)}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  leftIcon?: IconDefinition;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, leftIcon, children, ...props }, ref) => (
    <div className="relative">
      {leftIcon ? (
        <FontAwesomeIcon
          icon={leftIcon}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-gray-500"
          aria-hidden
        />
      ) : null}
      <select
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          base,
          "h-12 appearance-none pr-10",
          leftIcon ? "pl-10" : "pl-3.5",
          error ? bad : ok,
          className
        )}
        {...props}
      >
        {children}
      </select>
      <FontAwesomeIcon
        icon={faChevronDown}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-gray-500"
        aria-hidden
      />
    </div>
  )
);
Select.displayName = "Select";

export function RequiredMark() {
  return (
    <span className="ml-0.5 text-danger-500" aria-hidden title="Zorunlu">
      *
    </span>
  );
}

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("mb-1.5 block text-[13px] font-medium text-gray-600", className)}
      {...props}
    >
      {children}
      {required ? <RequiredMark /> : null}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-caption text-danger-600">{children}</p>;
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label ? <Label required={required}>{label}</Label> : null}
      {children}
      {error ? (
        <FieldError>{error}</FieldError>
      ) : hint ? (
        <p className="mt-1 text-caption text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-body-sm text-gray-700">
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500",
          className
        )}
        {...props}
      />
      {label}
    </label>
  );
}
