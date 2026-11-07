-- Deneyim sihirbazının yeni alanları (ikincil kategoriler, ürün tipi, zorluk, transfer,
-- para birimi kilidi, kademeli iptal, müşteri bilgi alanları, sezonluk fiyat kuralları)
-- ve daha önce şemaya eklenip migration'ı oluşturulmamış reviewedAt sütunu.
-- Yalnızca ekleme yapar; mevcut veri veya sütun silinmez.

-- CreateEnum
CREATE TYPE "ExperienceProductType" AS ENUM ('TOUR', 'ACTIVITY', 'TRANSFER', 'TICKET');

-- CreateEnum
CREATE TYPE "ExperienceDifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "CustomerInfoFieldType" AS ENUM ('TEXT', 'DATE', 'FILE', 'DROPDOWN');

-- AlterTable
ALTER TABLE "experiences" ADD COLUMN     "cancellationTiers" JSONB,
ADD COLUMN     "currencyLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "difficultyLevel" "ExperienceDifficultyLevel",
ADD COLUMN     "displayCurrency" TEXT,
ADD COLUMN     "pickupAreas" TEXT,
ADD COLUMN     "pickupFee" DECIMAL(10,2),
ADD COLUMN     "pickupOffered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productType" "ExperienceProductType",
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "secondaryCategories" "ExperienceCategory"[] DEFAULT ARRAY[]::"ExperienceCategory"[];

-- CreateTable
CREATE TABLE "experience_customer_info_fields" (
    "id" UUID NOT NULL,
    "experienceId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "CustomerInfoFieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "helpText" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_customer_info_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_seasonal_pricing_rules" (
    "id" UUID NOT NULL,
    "experienceId" UUID NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_seasonal_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experience_customer_info_fields_experienceId_idx" ON "experience_customer_info_fields"("experienceId");

-- CreateIndex
CREATE INDEX "experience_seasonal_pricing_rules_experienceId_idx" ON "experience_seasonal_pricing_rules"("experienceId");

-- AddForeignKey
ALTER TABLE "experience_customer_info_fields" ADD CONSTRAINT "experience_customer_info_fields_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_seasonal_pricing_rules" ADD CONSTRAINT "experience_seasonal_pricing_rules_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

