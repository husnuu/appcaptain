-- Guest-scoped messaging + booking payments (distinct from the legacy
-- Reservation/Stripe conversations & payments).

CREATE TYPE "GuestSenderType" AS ENUM ('CAPTAIN', 'GUEST', 'SYSTEM');
CREATE TYPE "BookingPaymentStatus" AS ENUM ('PENDING', 'PAID', 'PAYOUT_SENT', 'REFUNDED', 'FAILED');

CREATE TABLE "guest_conversations" (
    "id" TEXT NOT NULL,
    "boatId" TEXT,
    "bookingId" TEXT,
    "captainId" UUID NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "lastMessage" TEXT,
    "lastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_conversations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "guest_conversations_bookingId_key" ON "guest_conversations"("bookingId");
CREATE INDEX "guest_conversations_captainId_lastAt_idx" ON "guest_conversations"("captainId", "lastAt");

ALTER TABLE "guest_conversations" ADD CONSTRAINT "guest_conversations_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "guest_conversations" ADD CONSTRAINT "guest_conversations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "guest_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "GuestSenderType" NOT NULL,
    "senderName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "guest_messages_conversationId_createdAt_idx" ON "guest_messages"("conversationId", "createdAt");

ALTER TABLE "guest_messages" ADD CONSTRAINT "guest_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "guest_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "captainId" UUID NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "boatName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "BookingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "paidAt" TIMESTAMP(3),
    "payoutAt" TIMESTAMP(3),
    "invoiceUrl" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_payments_bookingId_key" ON "booking_payments"("bookingId");
CREATE INDEX "booking_payments_captainId_createdAt_idx" ON "booking_payments"("captainId", "createdAt");

ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
