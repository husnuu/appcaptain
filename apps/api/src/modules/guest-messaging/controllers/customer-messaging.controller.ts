import type { FastifyInstance, FastifyRequest } from "fastify";
import { sendGuestMessageSchema } from "@getyourboat/shared";
import { parseDetailed } from "../../../lib/validate.js";
import * as service from "../services/customer-messaging.service.js";

const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;

/**
 * Müşteri (web) mesajlaşma uç noktaları — Supabase oturumu ile.
 * Kaptan tarafı aynı konuşmaları /guest-conversations altından görür ve yanıtlar.
 */
export async function customerMessagingRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireCustomer);

  app.get("/customer/conversations", async (req) => {
    const conversations = await service.listConversations(req.customer!);
    return { conversations };
  });

  app.get("/customer/conversations/:id", async (req) => {
    return service.getThread(idParam(req), req.customer!);
  });

  app.post("/customer/conversations/:id/messages", async (req, reply) => {
    const { content } = parseDetailed(sendGuestMessageSchema, req.body);
    const message = await service.sendMessage(idParam(req), req.customer!, content);
    return reply.code(201).send({ message });
  });

  app.post("/customer/boats/:id/messages", async (req, reply) => {
    const { content } = parseDetailed(sendGuestMessageSchema, req.body);
    const result = await service.startInquiry(idParam(req), req.customer!, content);
    return reply.code(201).send(result);
  });
}
