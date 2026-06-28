import * as esbuild from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  entryPoints: [join(root, "src/vercel.ts")],
  outfile: join(root, "api/index.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: true,
  logLevel: "info",
  external: [
    "@prisma/client",
    "bcryptjs",
    "pino-pretty",
    "bufferutil",
    "utf-8-validate",
  ],
});

console.log("Vercel handler bundled to api/index.js");
