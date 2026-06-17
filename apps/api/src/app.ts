import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import { authPlugin } from "./plugins/auth.js";
import { supabaseAuthPlugin } from "./plugins/supabase-auth.js";
import { registerRoutes } from "./routes/index.js";
import { HttpError } from "./lib/errors.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV === "development"
          ? { target: "pino-pretty" }
          : undefined,
    },
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(authPlugin); // legacy JWT (phase 0)
  await app.register(supabaseAuthPlugin); // Supabase Auth (boat onboarding)
  await registerRoutes(app);

  app.setErrorHandler((error: FastifyError, _req, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({
        message: error.message,
        code: error.code,
        details: (error as HttpError & { details?: unknown }).details,
      });
    }
    app.log.error(error);
    return reply.code(error.statusCode ?? 500).send({
      message: error.message ?? "Internal Server Error",
    });
  });

  return app;
}
