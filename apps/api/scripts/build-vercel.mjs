import * as esbuild from "esbuild";
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = existsSync(join(apiRoot, "../../packages/database"))
  ? join(apiRoot, "../..")
  : process.cwd();

const prismaClientDir = join(monorepoRoot, "packages/database/generated/client");
const engineFile = "libquery_engine-rhel-openssl-3.0.x.so.node";

console.log("Monorepo root:", monorepoRoot);

execSync("pnpm --filter @getyourboat/shared build", {
  cwd: monorepoRoot,
  stdio: "inherit",
});
execSync("pnpm --filter @getyourboat/database build", {
  cwd: monorepoRoot,
  stdio: "inherit",
});

function copyPrismaEngines() {
  const enginePath = join(prismaClientDir, engineFile);
  if (!existsSync(enginePath)) {
    throw new Error(
      `Missing Prisma engine at ${enginePath}. Run pnpm --filter @getyourboat/database db:generate first.`
    );
  }

  const targets = [
    join(apiRoot, "api", engineFile),
    join(apiRoot, engineFile),
    join(apiRoot, "generated/client"),
    join(apiRoot, "api/generated/client"),
  ];

  for (const destDir of [targets[2], targets[3]]) {
    mkdirSync(destDir, { recursive: true });
    cpSync(prismaClientDir, destDir, { recursive: true });
    console.log("Copied Prisma client ->", destDir);
  }

  for (const destFile of [targets[0], targets[1]]) {
    mkdirSync(dirname(destFile), { recursive: true });
    cpSync(enginePath, destFile);
    console.log("Copied Prisma engine ->", destFile);
  }
}

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

copyPrismaEngines();

console.log("Vercel handler bundled to api/handler.cjs");
