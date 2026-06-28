import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import { buildApp } from "./app.js";

type ServerlessHandler = ReturnType<typeof serverless>;

let handler: ServerlessHandler | undefined;

async function getHandler(): Promise<ServerlessHandler> {
  if (!handler) {
    const app = await buildApp();
    await app.ready();
    handler = serverless(app.server);
  }
  return handler;
}

/** Vercel serverless entry — all HTTP routes are rewritten here via vercel.json. */
export default async function vercelHandler(req: VercelRequest, res: VercelResponse) {
  const proxy = await getHandler();
  return proxy(req, res);
}
