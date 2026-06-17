import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Sidebar navigation. Desktop: fixed 240px, navy (ink) background. Active item
 * gets a Brand Orange left accent + lightened background. On mobile this is
 * replaced by a bottom tab bar at the app level.
 */
export function Sidebar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className={cn("flex h-full w-60 flex-col gap-1 bg-ink-800 p-3 text-gray-100", className)}
      {...props}
    >
      {children}
    </aside>
  );
}

export function SidebarBrand({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 px-2 py-3 text-subheading font-bold text-white">{children}</div>
  );
}

export interface NavItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: LucideIcon;
  active?: boolean;
}

export const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ icon: Icon, active, className, children, ...props }, ref) => (
    <a
      ref={ref}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm font-medium transition",
        active
          ? "bg-brand-500 text-white hover:bg-brand-600"
          : "text-gray-300 hover:bg-white/5 hover:text-white",
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="h-5 w-5 shrink-0" aria-hidden /> : null}
      {children}
    </a>
  )
);
NavItem.displayName = "NavItem";
