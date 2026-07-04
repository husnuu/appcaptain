import type { Config } from "tailwindcss";
import preset from "@getyourboat/config/tailwind";

/**
 * Captain-only color overrides (SeaHub rebrand). The shared preset keeps the
 * orange `brand` for the customer web app; here we remap `brand` to turquoise
 * (accent / CTA) and add a `primary` navy scale for the sidebar and headings.
 * Because Tailwind compiles per-app, `brand-*` classes used inside the shared
 * UI package render turquoise in Captain and stay orange on the web app.
 */
const config: Config = {
  presets: [preset as unknown as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Turquoise — primary actions / CTA / active state (was orange).
        brand: {
          50: "#E0F7FA",
          100: "#B2EBF2",
          200: "#80DEEA",
          300: "#4DD0E1",
          400: "#26C6DA",
          500: "#0097A7",
          600: "#00838F",
          700: "#00787A",
          800: "#006064",
          900: "#004D50",
          DEFAULT: "#0097A7",
        },
        // Navy — primary brand color, sidebar background, headings.
        primary: {
          50: "#E7EEF4",
          100: "#C3D4E3",
          200: "#9BB8D0",
          300: "#6E97B6",
          400: "#1B6CA8",
          500: "#0F4C75",
          600: "#0C3F63",
          700: "#0A3352",
          800: "#082A44",
          900: "#061F33",
          DEFAULT: "#0F4C75",
        },
        // Turquoise alias for explicit accent usage.
        accent: {
          50: "#E0F7FA",
          100: "#B2EBF2",
          500: "#0097A7",
          600: "#00838F",
          700: "#00787A",
          DEFAULT: "#0097A7",
        },
      },
    },
  },
};

export default config;
