import { GuestSenderType } from "@getyourboat/shared";
import { guestConversationRepository, prisma } from "@getyourboat/database";
import type { CustomerUser } from "../../../plugins/customer-auth.js";
import { badRequest, notFound } from "../../../lib/errors.js";

/** Misafirin görünen adı: hesap adı → e-postanın @ öncesi → "Misafir". */
function displayName(customer: CustomerUser) {
  return customer.name || customer.email?.split("@")[0] || "Misafir";
}

function requireEmail(customer: CustomerUser): string {
  if (!customer.email) throw badRequest("Hesabına bağlı bir e-posta adresi bulunamadı");
  return customer.email;
}

export function listConversations(customer: CustomerUser) {
  return guestConversationRepository.listForGuest(requireEmail(customer));
}

async function loadOwned(id: string, customer: CustomerUser) {
  const conversation = await guestConversationRepository.getByIdForGuest(id, requireEmail(customer));
  if (!conversation) throw notFound("Konuşma bulunamadı");
  return conversation;
}

export async function getThread(id: string, customer: CustomerUser) {
  const conversation = await loadOwned(id, customer);
  const messages = await guestConversationRepository.getMessages(id);
  return { conversation, messages };
}

export async function sendMessage(id: string, customer: CustomerUser, content: string) {
  await loadOwned(id, customer);
  return guestConversationRepository.createMessage({
    conversationId: id,
    senderType: GuestSenderType.GUEST,
    senderName: displayName(customer),
    content,
  });
}

/** İlan sayfasından kaptana ilk mesaj: aynı tekne için açık konuşma varsa ona eklenir. */
export async function startInquiry(boatId: string, customer: CustomerUser, content: string) {
  const email = requireEmail(customer);
  const boat = await prisma.boat.findFirst({
    where: { id: boatId, status: "ACTIVE" },
    select: { ownerId: true },
  });
  if (!boat) throw notFound("Tekne bulunamadı");

  const conversation = await guestConversationRepository.getOrCreateForInquiry({
    boatId,
    captainId: boat.ownerId,
    guestEmail: email,
    guestName: displayName(customer),
  });
  const message = await guestConversationRepository.createMessage({
    conversationId: conversation.id,
    senderType: GuestSenderType.GUEST,
    senderName: displayName(customer),
    content,
  });
  return { conversationId: conversation.id, message };
}
