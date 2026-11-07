import * as React from "react";
import { cn } from "../lib/cn";
import { FontAwesomeIcon, type IconDefinition } from "../icons";

/**
 * Sidebar navigation (Ahoy panel dili). Beyaz zemin, ince sağ kenarlık;
 * aktif öğe açık lacivert zemin + lacivert metin. Mobilde uygulama seviyesinde
 * açılır çekmece olarak kullanılır.
 */
export function Sidebar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className={cn("flex h-full w-64 flex-col gap-1 border-r border-gray-200 bg-white px-4 py-5 text-ink", className)}
      {...props}
    >
      {children}
    </aside>
  );
}

export function SidebarBrand({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 px-2 pt-1">{children}</div>
  );
}

export interface NavItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: IconDefinition;
  active?: boolean;
}

export const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ icon, active, className, children, ...props }, ref) => (
    <a
      ref={ref}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium tracking-[-0.01em] transition",
        active
          ? "bg-brand-50 font-semibold text-brand-600"
          : "text-gray-600 hover:bg-gray-100 hover:text-ink",
        className
      )}
      {...props}
    >
      {icon ? (
        <FontAwesomeIcon
          icon={icon}
          className={cn("w-5 shrink-0 text-[17px]", active ? "text-brand-500" : "text-gray-400 group-hover:text-gray-600")}
          aria-hidden
        />
      ) : null}
      {children}
    </a>
  )
);
NavItem.displayName = "NavItem";
