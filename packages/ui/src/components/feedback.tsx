import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import {
  FontAwesomeIcon,
  faCircleInfo,
  faCircleCheck,
  faTriangleExclamation,
  faCircleXmark,
} from "../icons";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Yükleniyor"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500",
        className
      )}
    />
  );
}

const alertVariants = cva(
  "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-body-sm",
  {
    variants: {
      variant: {
        info: "border-brand-100 bg-brand-50 text-brand-700",
        success: "border-success-100 bg-success-50 text-success-700",
        warning: "border-warning-100 bg-warning-50 text-warning-700",
        danger: "border-danger-100 bg-danger-50 text-danger-700",
      },
    },
    defaultVariants: { variant: "danger" },
  }
);

const alertIcon = {
  info: faCircleInfo,
  success: faCircleCheck,
  warning: faTriangleExclamation,
  danger: faCircleXmark,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, children, ...props }: AlertProps) {
  const icon = alertIcon[variant ?? "danger"];
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props}>
      <FontAwesomeIcon icon={icon} className="mt-0.5 shrink-0 text-[14px]" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
