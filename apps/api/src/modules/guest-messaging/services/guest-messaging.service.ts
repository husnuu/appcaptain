import { GuestSenderType } from "@getyourboat/shared";
import { guestConversationRepository } from "@getyourboat/database";
import { notFound } from "../../../lib/errors.js";

export function listConversations(captainId: string) {
  return guestConversationRepository.listForCaptain(captainId);
}

export function unreadCount(captainId: string) {
  return guestConversationRepository.unreadCountForCaptain(captainId);
}

async function loadOwned(id: string, captainId: string) {
  const conversation = await guestConversationRepository.getByIdForCaptain(
    id,
    captainId
  );
  if (!conversation) throw notFound("Konuşma bulunamadı");
  return conversation;
}

export async function getConversation(id: string, captainId: string) {
  return loadOwned(id, captainId);
}

export async function getMessages(id: string, captainId: string) {
  await loadOwned(id, captainId);
  await guestConversationRepository.markRead(id);
  return guestConversationRepository.getMessages(id);
}

export async function sendCaptainMessage(
  id: string,
  captainId: string,
  content: string,
  senderName: string
) {
  await loadOwned(id, captainId);
  return guestConversationRepository.createMessage({
    conversationId: id,
    senderType: GuestSenderType.CAPTAIN,
    senderName: senderName || "Kaptan",
    content,
  });
}
