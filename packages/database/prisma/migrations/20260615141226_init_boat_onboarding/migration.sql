-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'CAPTAIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProfileRole" AS ENUM ('OWNER', 'ADMIN', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "BoatStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('INSTANT', 'MANUAL');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('LISTING_MODEL', 'BOAT_TYPE_FEATURES', 'AMENITIES', 'DESCRIPTION_RULES', 'PHOTOS', 'PRICING', 'DOCUMENTS');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExtraPricingType" AS ENUM ('PER_BOOKING', 'PER_PERSON', 'PER_DAY', 'PER_HOUR');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "ProfileRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_packages" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "onboarding_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_sections" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sourceSection" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "onboarding_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_field_definitions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "sourceSection" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceRow" INTEGER,
    "canBeExtra" BOOLEAN NOT NULL DEFAULT false,
    "amenityCategoryKey" TEXT,

    CONSTRAINT "onboarding_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_field_inclusions" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "packageKey" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "onboarding_field_inclusions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenity_categories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "amenity_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "canBeExtra" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_groups" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sourceSection" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "feature_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_definitions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "feature_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boat_type_options" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "boat_type_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_model_options" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "listing_model_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boats" (
    "id" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "approvalType" "ApprovalType" NOT NULL DEFAULT 'MANUAL',
    "boatTypeKey" TEXT,
    "title" TEXT,
    "description" TEXT,
    "rulesText" TEXT,
    "checkInNotes" TEXT,
    "checkOutNotes" TEXT,
    "structuredRules" JSONB,
    "status" "BoatStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" "OnboardingStep" NOT NULL DEFAULT 'LISTING_MODEL',
    "completedSteps" "OnboardingStep"[] DEFAULT ARRAY[]::"OnboardingStep"[],
    "isReadyForReview" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boat_listing_models" (
    "boatId" TEXT NOT NULL,
    "listingModelKey" TEXT NOT NULL,

    CONSTRAINT "boat_listing_models_pkey" PRIMARY KEY ("boatId","listingModelKey")
);

-- CreateTable
CREATE TABLE "boat_feature_values" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "boat_feature_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boat_amenities" (
    "boatId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,
    "extraPrice" DECIMAL(10,2),
    "currency" TEXT,

    CONSTRAINT "boat_amenities_pkey" PRIMARY KEY ("boatId","amenityId")
);

-- CreateTable
CREATE TABLE "boat_photos" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boat_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boat_pricing" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "listingModelKey" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',

    CONSTRAINT "boat_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boat_seasonal_prices" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "listingModelKey" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',

    CONSTRAINT "boat_seasonal_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boat_extras" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "pricingType" "ExtraPricingType" NOT NULL DEFAULT 'PER_BOOKING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boat_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boat_documents" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "documentTypeKey" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,

    CONSTRAINT "boat_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptainProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "businessName" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "payoutAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptainProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "guests" INTEGER NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "captainId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "stripeTransferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "captainId" TEXT NOT NULL,
    "boatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_packages_key_key" ON "onboarding_packages"("key");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_sections_key_key" ON "onboarding_sections"("key");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_field_definitions_key_key" ON "onboarding_field_definitions"("key");

-- CreateIndex
CREATE INDEX "onboarding_field_definitions_type_idx" ON "onboarding_field_definitions"("type");

-- CreateIndex
CREATE INDEX "onboarding_field_definitions_sectionKey_idx" ON "onboarding_field_definitions"("sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_field_inclusions_fieldId_packageKey_key" ON "onboarding_field_inclusions"("fieldId", "packageKey");

-- CreateIndex
CREATE UNIQUE INDEX "amenity_categories_key_key" ON "amenity_categories"("key");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_key_key" ON "amenities"("key");

-- CreateIndex
CREATE INDEX "amenities_categoryId_idx" ON "amenities"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_groups_key_key" ON "feature_groups"("key");

-- CreateIndex
CREATE UNIQUE INDEX "feature_definitions_key_key" ON "feature_definitions"("key");

-- CreateIndex
CREATE INDEX "feature_definitions_groupKey_idx" ON "feature_definitions"("groupKey");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_key_key" ON "document_types"("key");

-- CreateIndex
CREATE UNIQUE INDEX "boat_type_options_key_key" ON "boat_type_options"("key");

-- CreateIndex
CREATE UNIQUE INDEX "listing_model_options_key_key" ON "listing_model_options"("key");

-- CreateIndex
CREATE INDEX "boats_ownerId_idx" ON "boats"("ownerId");

-- CreateIndex
CREATE INDEX "boats_status_idx" ON "boats"("status");

-- CreateIndex
CREATE INDEX "boats_boatTypeKey_idx" ON "boats"("boatTypeKey");

-- CreateIndex
CREATE INDEX "boat_feature_values_boatId_idx" ON "boat_feature_values"("boatId");

-- CreateIndex
CREATE UNIQUE INDEX "boat_feature_values_boatId_featureKey_key" ON "boat_feature_values"("boatId", "featureKey");

-- CreateIndex
CREATE INDEX "boat_amenities_boatId_idx" ON "boat_amenities"("boatId");

-- CreateIndex
CREATE INDEX "boat_photos_boatId_idx" ON "boat_photos"("boatId");

-- CreateIndex
CREATE INDEX "boat_pricing_boatId_idx" ON "boat_pricing"("boatId");

-- CreateIndex
CREATE UNIQUE INDEX "boat_pricing_boatId_listingModelKey_key" ON "boat_pricing"("boatId", "listingModelKey");

-- CreateIndex
CREATE INDEX "boat_seasonal_prices_boatId_idx" ON "boat_seasonal_prices"("boatId");

-- CreateIndex
CREATE INDEX "boat_extras_boatId_idx" ON "boat_extras"("boatId");

-- CreateIndex
CREATE INDEX "boat_documents_boatId_idx" ON "boat_documents"("boatId");

-- CreateIndex
CREATE INDEX "boat_documents_status_idx" ON "boat_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "CaptainProfile_userId_key" ON "CaptainProfile"("userId");

-- CreateIndex
CREATE INDEX "Reservation_boatId_idx" ON "Reservation"("boatId");

-- CreateIndex
CREATE INDEX "Reservation_customerId_idx" ON "Reservation"("customerId");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reservationId_key" ON "Payment"("reservationId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_reservationId_key" ON "Payout"("reservationId");

-- CreateIndex
CREATE INDEX "Payout_captainId_idx" ON "Payout"("captainId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "Conversation_customerId_idx" ON "Conversation"("customerId");

-- CreateIndex
CREATE INDEX "Conversation_captainId_idx" ON "Conversation"("captainId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_customerId_captainId_boatId_key" ON "Conversation"("customerId", "captainId", "boatId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reservationId_key" ON "Review"("reservationId");

-- CreateIndex
CREATE INDEX "Review_boatId_idx" ON "Review"("boatId");

-- AddForeignKey
ALTER TABLE "onboarding_field_definitions" ADD CONSTRAINT "onboarding_field_definitions_sectionKey_fkey" FOREIGN KEY ("sectionKey") REFERENCES "onboarding_sections"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_field_inclusions" ADD CONSTRAINT "onboarding_field_inclusions_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "onboarding_field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_field_inclusions" ADD CONSTRAINT "onboarding_field_inclusions_packageKey_fkey" FOREIGN KEY ("packageKey") REFERENCES "onboarding_packages"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "amenity_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_definitions" ADD CONSTRAINT "feature_definitions_groupKey_fkey" FOREIGN KEY ("groupKey") REFERENCES "feature_groups"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boats" ADD CONSTRAINT "boats_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boats" ADD CONSTRAINT "boats_boatTypeKey_fkey" FOREIGN KEY ("boatTypeKey") REFERENCES "boat_type_options"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boats" ADD CONSTRAINT "boats_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_listing_models" ADD CONSTRAINT "boat_listing_models_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_listing_models" ADD CONSTRAINT "boat_listing_models_listingModelKey_fkey" FOREIGN KEY ("listingModelKey") REFERENCES "listing_model_options"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_feature_values" ADD CONSTRAINT "boat_feature_values_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_feature_values" ADD CONSTRAINT "boat_feature_values_featureKey_fkey" FOREIGN KEY ("featureKey") REFERENCES "feature_definitions"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_amenities" ADD CONSTRAINT "boat_amenities_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_amenities" ADD CONSTRAINT "boat_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_photos" ADD CONSTRAINT "boat_photos_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_pricing" ADD CONSTRAINT "boat_pricing_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_pricing" ADD CONSTRAINT "boat_pricing_listingModelKey_fkey" FOREIGN KEY ("listingModelKey") REFERENCES "listing_model_options"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_seasonal_prices" ADD CONSTRAINT "boat_seasonal_prices_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_seasonal_prices" ADD CONSTRAINT "boat_seasonal_prices_listingModelKey_fkey" FOREIGN KEY ("listingModelKey") REFERENCES "listing_model_options"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_extras" ADD CONSTRAINT "boat_extras_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_documents" ADD CONSTRAINT "boat_documents_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_documents" ADD CONSTRAINT "boat_documents_documentTypeKey_fkey" FOREIGN KEY ("documentTypeKey") REFERENCES "document_types"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_documents" ADD CONSTRAINT "boat_documents_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptainProfile" ADD CONSTRAINT "CaptainProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "CaptainProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Enforce a single cover photo per boat (partial unique index)
CREATE UNIQUE INDEX "boat_photos_one_cover_per_boat"
  ON "boat_photos" ("boatId")
  WHERE "isCover" = true;
