import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Form controls. Border 1px gray-300, focus ring 2px Brand Orange, error state
 * uses danger border + a 12px caption-sized red message. All forms validate
 * with the shared Zod schemas; error text is rendered here, not inline.
 */

const base =
  "w-full rounded-lg border bg-white text-body-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:ring-2 disabled:opacity-60 disabled:bg-gray-100";
const ok = "border-gray-300 focus:border-brand-500 focus:ring-brand-100";
const bad = "border-danger-500 focus:border-danger-500 focus:ring-danger-100";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(base, "h-11 px-3", error ? bad : ok, className)}
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
      className={cn(base, "min-h-[88px] px-3 py-2", error ? bad : ok, className)}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(base, "h-11 px-3", error ? bad : ok, className)}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-body-sm font-medium text-gray-700", className)}
      {...props}
    />
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
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label ? <Label>{label}</Label> : null}
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
