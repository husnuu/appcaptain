import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

let app: FastifyInstance | undefined;
let ready: Promise<void> | undefined;

async function getApp(): Promise<FastifyInstance> {
  if (!app) {
    console.log("[gyb-api] buildApp start");
    app = await buildApp();
    ready = app.ready();
  }
  await ready;
  console.log("[gyb-api] buildApp ready");
  return app;
}

function forwardRequest(app: FastifyInstance, req: VercelRequest, res: VercelResponse) {
  return new Promise<void>((resolve, reject) => {
    const done = () => resolve();
    res.once("finish", done);
    res.once("close", done);
    res.once("error", reject);
    app.server.emit("request", req, res);
  });
}

/** Bundled Vercel serverless entry (see scripts/build-vercel.mjs). */
export default async function vercelHandler(req: VercelRequest, res: VercelResponse) {
  console.log("[gyb-api] handler invoked", req.method, req.url);
  const instance = await getApp();
  await forwardRequest(instance, req, res);
  console.log("[gyb-api] response sent", req.method, req.url, res.statusCode);
}
