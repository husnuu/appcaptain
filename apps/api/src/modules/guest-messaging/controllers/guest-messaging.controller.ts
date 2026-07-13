import type { FastifyInstance, FastifyRequest } from "fastify";
import { sendGuestMessageSchema } from "@getyourboat/shared";
import { parseDetailed } from "../../../lib/validate.js";
import * as service from "../services/guest-messaging.service.js";

const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;
const captainName = (req: FastifyRequest) =>
  (req.authUser!.email?.split("@")[0] ?? "Kaptan");

export async function guestMessagingRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAuth);

  app.get("/guest-conversations", async (req) => {
    const conversations = await service.listConversations(req.authUser!.id);
    return { conversations };
  });

  app.get("/guest-conversations/unread-count", async (req) => {
    const count = await service.unreadCount(req.authUser!.id);
    return { count };
  });

  app.get("/guest-conversations/:id", async (req) => {
    const conversation = await service.getConversation(
      idParam(req),
      req.authUser!.id
    );
    return { conversation };
  });

  app.get("/guest-conversations/:id/messages", async (req) => {
    const messages = await service.getMessages(idParam(req), req.authUser!.id);
    return { messages };
  });

  app.post("/guest-conversations/:id/messages", async (req, reply) => {
    const { content } = parseDetailed(sendGuestMessageSchema, req.body);
    const message = await service.sendCaptainMessage(
      idParam(req),
      req.authUser!.id,
      content,
      captainName(req)
    );
    return reply.code(201).send({ message });
  });
}
