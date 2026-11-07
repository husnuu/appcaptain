import type { FastifyInstance, FastifyRequest } from "fastify";
import { sendGuestMessageSchema } from "@getyourboat/shared";
import { prisma } from "@getyourboat/database";
import { parseDetailed } from "../../../lib/validate.js";
import * as service from "../services/guest-messaging.service.js";

const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;
/** Misafire görünen kaptan adı: profildeki ilk ad (ilan sayfasıyla aynı), yoksa e-posta öneki. */
async function captainName(req: FastifyRequest): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { id: req.authUser!.id },
    select: { fullName: true },
  });
  const first = profile?.fullName?.trim().split(/\s+/)[0];
  if (first) return first.charAt(0).toLocaleUpperCase("tr") + first.slice(1);
  return req.authUser!.email?.split("@")[0] ?? "Kaptan";
}

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
      await captainName(req)
    );
    return reply.code(201).send({ message });
  });
}
