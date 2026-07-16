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

  await app.register(cors, {
    origin: [...captainOrigins, ...adminOrigins],
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
