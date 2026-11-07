import type {
  GuestConversationDTO,
  GuestMessageDTO,
  GuestSenderType,
} from "@getyourboat/shared";

export interface CreateGuestMessageData {
  conversationId: string;
  senderType: GuestSenderType;
  senderName: string;
  content: string;
  attachmentUrl?: string | null;
}

export interface GetOrCreateConversationData {
  bookingId: string;
  captainId: string;
  guestName: string;
  guestEmail: string;
  boatId?: string | null;
  initialMessage?: string | null;
}

/** Rezervasyon öncesi ilan sayfasından başlatılan konuşma. */
export interface GetOrCreateInquiryData {
  boatId: string;
  captainId: string;
  guestName: string;
  guestEmail: string;
}

export interface GuestConversationRepository {
  listForCaptain(captainId: string): Promise<GuestConversationDTO[]>;
  getByIdForCaptain(
    id: string,
    captainId: string
  ): Promise<GuestConversationDTO | null>;
  getMessages(conversationId: string): Promise<GuestMessageDTO[]>;
  /** Marks non-captain messages read and resets the conversation unread counter. */
  markRead(conversationId: string): Promise<void>;
  createMessage(data: CreateGuestMessageData): Promise<GuestMessageDTO>;
  unreadCountForCaptain(captainId: string): Promise<number>;
  getOrCreateForBooking(
    data: GetOrCreateConversationData
  ): Promise<GuestConversationDTO>;
  /** Aynı misafir + tekne için açık (rezervasyonsuz) konuşmayı döner, yoksa oluşturur. */
  getOrCreateForInquiry(data: GetOrCreateInquiryData): Promise<GuestConversationDTO>;
  /** Misafirin (e-posta ile) tüm konuşmaları — rezervasyonlu ve rezervasyonsuz. */
  listForGuest(guestEmail: string): Promise<GuestConversationDTO[]>;
  getByIdForGuest(id: string, guestEmail: string): Promise<GuestConversationDTO | null>;
}
