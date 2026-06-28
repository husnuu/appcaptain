import type { FastifyInstance } from "fastify";
import { Server as SocketServer, type Server, type Socket } from "socket.io";
import {
  joinConversationSchema,
  markReadSchema,
  sendMessageSchema,
  SOCKET_EVENTS,
  conversationRoom,
} from "@getyourboat/shared";
import type { ProfileRole } from "@getyourboat/shared";
import { authRepository } from "@getyourboat/database";
import { captainOrigins } from "../../config/env.js";
import * as service from "./services/messaging.service.js";

let io: Server | null = null;

function socketError(socket: Socket, message: string) {
  socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, { message });
}

async function verifySocketToken(
  app: FastifyInstance,
  token: string | undefined
): Promise<{ id: string; role: ProfileRole } | null> {
  if (!token) return null;
  try {
    const payload = await app.jwt.verify<{ sub: string; role: ProfileRole }>(token);
    if (!payload.sub) return null;
    const profile = await authRepository.findById(payload.sub);
    if (!profile) return null;
    return { id: profile.id, role: profile.role };
  } catch {
    return null;
  }
}

export function attachMessagingSocket(app: FastifyInstance) {
  if (io) return io;

  io = new SocketServer(app.server, {
    cors: {
      origin: captainOrigins.length === 1 ? captainOrigins[0]! : captainOrigins,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "") || undefined);
    const user = await verifySocketToken(app, token);
    if (!user) {
      next(new Error("Unauthorized"));
      return;
    }
    socket.data.user = user;
    next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as { id: string; role: ProfileRole };

    socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async (payload, ack) => {
      const parsed = joinConversationSchema.safeParse(payload);
      if (!parsed.success) {
        socketError(socket, "Geçersiz istek");
        ack?.({ ok: false });
        return;
      }
      try {
        await service.assertConversationAccess(user.id, parsed.data.conversationId);
        await socket.join(conversationRoom(parsed.data.conversationId));
        ack?.({ ok: true });
      } catch {
        socketError(socket, "Erişim reddedildi");
        ack?.({ ok: false });
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, (payload) => {
      const parsed = joinConversationSchema.safeParse(payload);
      if (!parsed.success) return;
      void socket.leave(conversationRoom(parsed.data.conversationId));
    });

    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (payload, ack) => {
      const parsed = sendMessageSchema.safeParse(payload);
      if (!parsed.success) {
        socketError(socket, "Geçersiz mesaj");
        ack?.({ ok: false });
        return;
      }
      try {
        await service.assertConversationAccess(user.id, parsed.data.conversationId);
        const message = await service.sendMessage(
          user.id,
          parsed.data.conversationId,
          parsed.data.body,
          parsed.data.attachmentUrl
        );
        io!.to(conversationRoom(parsed.data.conversationId)).emit(
          SOCKET_EVENTS.NEW_MESSAGE,
          { message }
        );
        ack?.({ ok: true, message });
      } catch (err) {
        const msg =
          err instanceof Error && err.message === "RATE_LIMIT"
            ? "Çok fazla mesaj gönderdin"
            : "Mesaj gönderilemedi";
        socketError(socket, msg);
        ack?.({ ok: false });
      }
    });

    socket.on(SOCKET_EVENTS.TYPING, (payload) => {
      const parsed = joinConversationSchema.safeParse(payload);
      if (!parsed.success) return;
      socket.to(conversationRoom(parsed.data.conversationId)).emit(SOCKET_EVENTS.USER_TYPING, {
        conversationId: parsed.data.conversationId,
        userId: user.id,
      });
    });

    socket.on(SOCKET_EVENTS.MARK_READ, async (payload, ack) => {
      const parsed = markReadSchema.safeParse(payload);
      if (!parsed.success) {
        ack?.({ ok: false });
        return;
      }
      try {
        const result = await service.markRead(
          user.id,
          parsed.data.conversationId,
          parsed.data.messageId
        );
        io!.to(conversationRoom(parsed.data.conversationId)).emit(
          SOCKET_EVENTS.MESSAGES_READ,
          {
            conversationId: parsed.data.conversationId,
            messageId: parsed.data.messageId,
            readerId: user.id,
            count: result.count,
          }
        );
        ack?.({ ok: true, ...result });
      } catch {
        ack?.({ ok: false });
      }
    });
  });

  app.log.info("Messaging Socket.IO attached");
  return io;
}

export function getMessagingIo(): Server | null {
  return io;
}
