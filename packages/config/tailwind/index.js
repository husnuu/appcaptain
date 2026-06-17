/**
 * Shared Tailwind preset for all GetYourBoat frontends.
 *
 * Design system: GetYourGuide-inspired. This preset is the single source of
 * truth for color, typography, spacing, radius and breakpoints. See
 * packages/ui/DESIGN.md before adding new tokens.
 *
 * @type {import("tailwindcss").Config}
 */

// Spec greys (also aliased onto `slate` so existing usage adopts the palette).
const gray = {
  50: "#F9FAFB",
  100: "#F3F4F6",
  200: "#E5E7EB",
  300: "#D1D5DB",
  400: "#9CA3AF",
  500: "#6B7280",
  600: "#4B5563",
  700: "#374151",
  800: "#1F2937",
  900: "#1F2937",
};

module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand Orange — primary actions, active state, emphasis, link hover.
        brand: {
          50: "#FFF1EE",
          100: "#FFE0D9",
          200: "#FFC3B5",
          300: "#FF9D87",
          400: "#FF7559",
          500: "#FF5533",
          600: "#ED3C18",
          700: "#C52F10",
          800: "#9C2710",
          900: "#7E2413",
          DEFAULT: "#FF5533",
        },
        // Navy / Ink — headings, primary text, sidebar background.
        ink: {
          50: "#EAEAEF",
          100: "#C9C9D6",
          400: "#3A3A55",
          500: "#2A2A42",
          600: "#222238",
          700: "#1F1F33",
          800: "#1A1A2E",
          900: "#141425",
          DEFAULT: "#1A1A2E",
        },
        // Status colors.
        success: { 50: "#ECFDF5", 100: "#D1FAE5", 500: "#10B981", 600: "#059669", 700: "#047857", DEFAULT: "#10B981" },
        warning: { 50: "#FFFBEB", 100: "#FEF3C7", 500: "#F59E0B", 600: "#D97706", 700: "#B45309", DEFAULT: "#F59E0B" },
        danger: { 50: "#FEF2F2", 100: "#FEE2E2", 500: "#EF4444", 600: "#DC2626", 700: "#B91C1C", DEFAULT: "#EF4444" },
        info: { 50: "#EFF6FF", 100: "#DBEAFE", 500: "#3B82F6", 600: "#2563EB", 700: "#1D4ED8", DEFAULT: "#3B82F6" },
        gray,
        // Alias slate -> spec greys so existing slate-* classes follow the system.
        slate: gray,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Typographic scale (size + line-height + default weight).
        display: ["32px", { lineHeight: "40px", fontWeight: "700" }],
        heading: ["24px", { lineHeight: "32px", fontWeight: "700" }],
        subheading: ["18px", { lineHeight: "28px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      borderRadius: {
        card: "12px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 16px rgba(26, 26, 46, 0.10)",
        modal: "0 20px 60px rgba(26, 26, 46, 0.25)",
      },
      maxWidth: {
        content: "1280px",
      },
    },
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1440px",
    },
  },
  plugins: [],
};
