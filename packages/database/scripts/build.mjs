import * as esbuild from "esbuild";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = join(root, "../..");

execSync("pnpm --filter @getyourboat/database db:generate", {
  cwd: monorepoRoot,
  stdio: "inherit",
});

await esbuild.build({
  entryPoints: [join(root, "src/index.ts")],
  outfile: join(root, "dist/index.cjs"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  logLevel: "info",
  external: ["bcryptjs"],
  alias: {
    "@getyourboat/shared": join(monorepoRoot, "packages/shared/dist/index.js"),
  },
});

console.log("Built @getyourboat/database -> dist/index.cjs");
