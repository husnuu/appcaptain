import * as esbuild from "esbuild";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = existsSync(join(apiRoot, "../../packages/database"))
  ? join(apiRoot, "../..")
  : process.cwd();

console.log("Monorepo root:", monorepoRoot);

execSync("pnpm --filter @getyourboat/shared build", {
  cwd: monorepoRoot,
  stdio: "inherit",
});
execSync("pnpm --filter @getyourboat/database build", {
  cwd: monorepoRoot,
  stdio: "inherit",
});

await esbuild.build({
  entryPoints: [join(apiRoot, "scripts/handler.ts")],
  outfile: join(apiRoot, "api/handler.cjs"),
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
  alias: {
    "@getyourboat/database": join(monorepoRoot, "packages/database/dist/index.js"),
    "@getyourboat/shared": join(monorepoRoot, "packages/shared/dist/index.js"),
  },
});

console.log("Vercel handler bundled to api/handler.cjs");
