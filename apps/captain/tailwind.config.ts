import type { Config } from "tailwindcss";
import panel from "@getyourboat/config/tailwind/panel";

/**
 * Kaptan paneli — Ahoy Boats panel ön ayarı (lacivert/gök mavisi/krem, Manrope).
 * Renk ve tipografi tokenları packages/config/tailwind/panel.js içinde.
 */
const config: Config = {
  presets: [panel as unknown as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
