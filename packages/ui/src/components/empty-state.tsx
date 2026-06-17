import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Generic empty state for lists/sections with no data. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-gray-300 bg-white px-6 py-12 text-center",
        className
      )}
    >
      {Icon ? <Icon className="mb-3 h-8 w-8 text-gray-400" aria-hidden /> : null}
      <h3 className="text-subheading text-ink">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-body-sm text-gray-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
