-- Discount management: date/time-range discounts for boats and experiences

CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "DiscountTarget" AS ENUM ('BOAT', 'EXPERIENCE', 'ALL_BOATS', 'ALL_EXPERIENCES');
CREATE TYPE "DiscountDayFilter" AS ENUM ('ALL', 'WEEKDAY', 'WEEKEND');

CREATE TABLE "discounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "target" "DiscountTarget" NOT NULL,
    "boatId" TEXT,
    "experienceId" UUID,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "timeStart" TEXT,
    "timeEnd" TEXT,
    "dayFilter" "DiscountDayFilter" NOT NULL DEFAULT 'ALL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "discounts_target_idx" ON "discounts"("target");
CREATE INDEX "discounts_isActive_idx" ON "discounts"("isActive");
CREATE INDEX "discounts_boatId_idx" ON "discounts"("boatId");
CREATE INDEX "discounts_experienceId_idx" ON "discounts"("experienceId");

ALTER TABLE "discounts" ADD CONSTRAINT "discounts_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
