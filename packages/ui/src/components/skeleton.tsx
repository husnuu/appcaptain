import { cn } from "../lib/cn";

export interface SkeletonProps {
  className?: string;
}

/** Loading placeholder block. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded bg-gray-200", className)}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-gray-200"
          style={{ width: `${Math.max(40, 95 - i * 12)}%` }}
        />
      ))}
    </div>
  );
}
