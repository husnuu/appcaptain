import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { FontAwesomeIcon, faSpinner } from "../icons";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 ease-in-out hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary action — Brand (turquoise in Captain).
        primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
        // Secondary — ink/navy outline-ish solid.
        secondary: "bg-ink-800 text-white hover:bg-ink-900",
        outline:
          "border border-gray-300 bg-white text-gray-900 hover:bg-gray-100",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
        danger: "bg-danger-500 text-white hover:bg-danger-600",
        link: "bg-transparent text-brand-600 hover:underline px-0 hover:translate-y-0",
      },
      size: {
        sm: "h-9 px-3 text-body-sm",
        md: "h-11 px-5 text-body-sm",
        lg: "h-12 px-7 text-body",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <FontAwesomeIcon icon={faSpinner} spin className="text-[16px]" aria-hidden />
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { buttonVariants };
