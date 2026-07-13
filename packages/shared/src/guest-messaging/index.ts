import { z } from "zod";

export const GuestSenderType = {
  CAPTAIN: "CAPTAIN",
  GUEST: "GUEST",
  SYSTEM: "SYSTEM",
} as const;
export type GuestSenderType = (typeof GuestSenderType)[keyof typeof GuestSenderType];

export interface GuestConversationBookingRef {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface GuestConversationDTO {
  id: string;
  boatId: string | null;
  bookingId: string | null;
  captainId: string;
  guestEmail: string;
  guestName: string;
  lastMessage: string | null;
  lastAt: string;
  unreadCount: number;
  createdAt: string;
  boat: { id: string; name: string } | null;
  booking: GuestConversationBookingRef | null;
}

export interface GuestMessageDTO {
  id: string;
  conversationId: string;
  senderType: GuestSenderType;
  senderName: string;
  content: string;
  attachmentUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export const sendGuestMessageSchema = z.object({
  content: z.string().trim().min(1, "Mesaj boş olamaz").max(2000, "Mesaj çok uzun"),
});
export type SendGuestMessageInput = z.infer<typeof sendGuestMessageSchema>;
