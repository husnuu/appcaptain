-- Guest booking requests for public listings (captain approves/rejects)

CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "RentalType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'STAY');

CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "captainId" UUID NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "guestCount" INTEGER NOT NULL,
    "rentalType" "RentalType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "totalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "message" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bookings_boatId_idx" ON "bookings"("boatId");
CREATE INDEX "bookings_captainId_idx" ON "bookings"("captainId");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
