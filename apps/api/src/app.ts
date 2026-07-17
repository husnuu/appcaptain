import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { authPlugin } from "./plugins/auth.js";
import { captainAuthPlugin } from "./plugins/captain-auth.js";
import { adminAuthPlugin } from "./plugins/admin-auth.js";
import { registerRoutes } from "./routes/index.js";
import { HttpError } from "./lib/errors.js";
import { captainOrigins, adminOrigins } from "./config/env.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV === "development"
          ? { target: "pino-pretty" }
          : undefined,
    },
  });

  // Known production/local origins that are always allowed, merged with the
  // env-driven CAPTAIN_ORIGIN/ADMIN_ORIGIN lists (deduped) so admin/captain
  // panels work even if a Vercel env var is missing.
  const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://appcaptain-captain.vercel.app",
    "https://appcaptain-admin.vercel.app",
  ];
  const allowedOrigins = [
    ...new Set([...defaultOrigins, ...captainOrigins, ...adminOrigins]),
  ];

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(authPlugin); // legacy JWT (phase 0)
  await app.register(captainAuthPlugin);
  await app.register(adminAuthPlugin);
  await registerRoutes(app);

  app.setErrorHandler((error: FastifyError, _req, reply) => {
    if (error instanceof HttpError) {
      const enriched = error as HttpError & { details?: unknown; fields?: unknown };
      return reply.code(error.statusCode).send({
        message: error.message,
        code: error.code,
        error: error.code,
        fields: enriched.fields,
        details: enriched.details,
      });
    }
    app.log.error(error);
    return reply.code(error.statusCode ?? 500).send({
      message: error.message ?? "Internal Server Error",
    });
  });

  return app;
}
