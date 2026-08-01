import type { Config } from "tailwindcss";
import preset from "@getyourboat/config/tailwind";

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
        // Same teal palette as the captain panel.
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
        // Same navy palette as the captain panel.
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
        accent: {
          50: "#E0F7FA",
          100: "#B2EBF2",
          500: "#0097A7",
          600: "#00838F",
          DEFAULT: "#0097A7",
        },
      },
    },
  },
};

export default config;
