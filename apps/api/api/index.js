import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const functionDir = dirname(fileURLToPath(import.meta.url));

const enginePath = join(functionDir, "libquery_engine-rhel-openssl-3.0.x.so.node");

if (existsSync(enginePath)) {
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
  console.log("[gyb-api] Prisma query engine:", enginePath);
} else {
  console.error("[gyb-api] Prisma query engine not found at", enginePath);
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
  includeFiles: ["libquery_engine-rhel-openssl-3.0.x.so.node"],
};
