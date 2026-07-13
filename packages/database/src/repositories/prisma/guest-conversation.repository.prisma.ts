import {
  GuestSenderType,
  type GuestConversationDTO,
  type GuestMessageDTO,
} from "@getyourboat/shared";
import { Prisma, prisma } from "../../client.js";
import type {
  CreateGuestMessageData,
  GetOrCreateConversationData,
  GuestConversationRepository,
} from "../guest-conversation.repository.js";

const includeRefs = {
  boat: { select: { id: true, title: true } },
  booking: { select: { id: true, status: true, startDate: true, endDate: true } },
} satisfies Prisma.GuestConversationInclude;

type ConversationRow = Prisma.GuestConversationGetPayload<{ include: typeof includeRefs }>;
type MessageRow = Prisma.GuestMessageGetPayload<object>;

function toConversationDTO(row: ConversationRow): GuestConversationDTO {
  return {
    id: row.id,
    boatId: row.boatId,
    bookingId: row.bookingId,
    captainId: row.captainId,
    guestEmail: row.guestEmail,
    guestName: row.guestName,
    lastMessage: row.lastMessage,
    lastAt: row.lastAt.toISOString(),
    unreadCount: row.unreadCount,
    createdAt: row.createdAt.toISOString(),
    boat: row.boat
      ? { id: row.boat.id, name: row.boat.title?.trim() || "İsimsiz tekne" }
      : null,
    booking: row.booking
      ? {
          id: row.booking.id,
          status: row.booking.status,
          startDate: row.booking.startDate.toISOString(),
          endDate: row.booking.endDate.toISOString(),
        }
      : null,
  };
}

function toMessageDTO(row: MessageRow): GuestMessageDTO {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderType: row.senderType as GuestSenderType,
    senderName: row.senderName,
    content: row.content,
    attachmentUrl: row.attachmentUrl,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

export class PrismaGuestConversationRepository
  implements GuestConversationRepository
{
  async listForCaptain(captainId: string) {
    const rows = await prisma.guestConversation.findMany({
      where: { captainId },
      orderBy: { lastAt: "desc" },
      include: includeRefs,
    });
    return rows.map(toConversationDTO);
  }

  async getByIdForCaptain(id: string, captainId: string) {
    const row = await prisma.guestConversation.findFirst({
      where: { id, captainId },
      include: includeRefs,
    });
    return row ? toConversationDTO(row) : null;
  }

  async getMessages(conversationId: string) {
    const rows = await prisma.guestMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toMessageDTO);
  }

  async markRead(conversationId: string) {
    await prisma.$transaction([
      prisma.guestMessage.updateMany({
        where: {
          conversationId,
          senderType: { not: GuestSenderType.CAPTAIN },
          isRead: false,
        },
        data: { isRead: true },
      }),
      prisma.guestConversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 },
      }),
    ]);
  }

  async createMessage(data: CreateGuestMessageData) {
    const [message] = await prisma.$transaction([
      prisma.guestMessage.create({
        data: {
          conversationId: data.conversationId,
          senderType: data.senderType,
          senderName: data.senderName,
          content: data.content,
          attachmentUrl: data.attachmentUrl ?? null,
          isRead: data.senderType === GuestSenderType.CAPTAIN,
        },
      }),
      prisma.guestConversation.update({
        where: { id: data.conversationId },
        data: {
          lastMessage: data.content,
          lastAt: new Date(),
          ...(data.senderType === GuestSenderType.GUEST
            ? { unreadCount: { increment: 1 } }
            : {}),
        },
      }),
    ]);
    return toMessageDTO(message);
  }

  async unreadCountForCaptain(captainId: string) {
    const result = await prisma.guestConversation.aggregate({
      where: { captainId },
      _sum: { unreadCount: true },
    });
    return result._sum.unreadCount ?? 0;
  }

  async getOrCreateForBooking(data: GetOrCreateConversationData) {
    const existing = await prisma.guestConversation.findUnique({
      where: { bookingId: data.bookingId },
      include: includeRefs,
    });
    if (existing) return toConversationDTO(existing);

    const created = await prisma.guestConversation.create({
      data: {
        bookingId: data.bookingId,
        captainId: data.captainId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        boatId: data.boatId ?? null,
        lastMessage: data.initialMessage ?? null,
        unreadCount: data.initialMessage ? 1 : 0,
        ...(data.initialMessage
          ? {
              messages: {
                create: {
                  senderType: GuestSenderType.GUEST,
                  senderName: data.guestName,
                  content: data.initialMessage,
                },
              },
            }
          : {}),
      },
      include: includeRefs,
    });
    return toConversationDTO(created);
  }
}
