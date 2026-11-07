import panel from "@getyourboat/config/tailwind/panel";

/**
 * Admin paneli — Ahoy Boats panel ön ayarı (lacivert/gök mavisi/krem, Manrope).
 * @type {import("tailwindcss").Config}
 */
const config = {
  presets: [panel],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
