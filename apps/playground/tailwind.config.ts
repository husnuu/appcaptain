import type { Config } from "tailwindcss";
import preset from "@getyourboat/config/tailwind";

const config: Config = {
  presets: [preset as unknown as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
