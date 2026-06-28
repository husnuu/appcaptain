import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

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
};
