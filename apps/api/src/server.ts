import { buildApp } from "./app.js";
import { attachMessagingSocket } from "./modules/messaging/socket.js";
import { env } from "./config/env.js";

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
    // Socket.IO requires a long-running HTTP server — skipped on Vercel serverless.
    if (!process.env.VERCEL) {
      attachMessagingSocket(app);
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
