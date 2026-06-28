import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const functionDir = dirname(fileURLToPath(import.meta.url));

const engineCandidates = [
  join(functionDir, "generated/client/libquery_engine-rhel-openssl-3.0.x.so.node"),
  join(functionDir, "libquery_engine-rhel-openssl-3.0.x.so.node"),
];

for (const enginePath of engineCandidates) {
  if (existsSync(enginePath)) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
    console.log("[gyb-api] Prisma query engine:", enginePath);
    break;
  }
}

if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  console.error(
    "[gyb-api] Prisma query engine not found. Checked:",
    engineCandidates.join(", "),
  );
}

let handler;

async function loadHandler() {
  if (!handler) {
    console.log("[gyb-api] loading handler bundle");
    const handlerModule = require("./handler.cjs");
    handler = typeof handlerModule === "function" ? handlerModule : handlerModule.default;
  }
  return handler;
}

export default async function vercelEntry(req, res) {
  const fn = await loadHandler();
  return fn(req, res);
}

export const config = {
  maxDuration: 30,
  includeFiles: [
    "libquery_engine-rhel-openssl-3.0.x.so.node",
    "generated/client/**",
  ],
};
