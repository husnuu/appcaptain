-- Extend Experience with GetYourGuide-style fields (reference code, end point,
-- items to bring, min age, ticket type, accessibility options) and switch the
-- default currency to TRY. All columns are nullable or defaulted, so existing
-- rows are preserved without data migration.

ALTER TABLE "experiences"
  ADD COLUMN "referenceCode" TEXT,
  ADD COLUMN "toBring" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "endPoint" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "endPointLat" DOUBLE PRECISION,
  ADD COLUMN "endPointLng" DOUBLE PRECISION,
  ADD COLUMN "isSameEndPoint" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "minAge" INTEGER,
  ADD COLUMN "ticketType" TEXT,
  ADD COLUMN "accessibilityOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- New listings default to TRY; existing rows keep their stored currency.
ALTER TABLE "experiences" ALTER COLUMN "currency" SET DEFAULT 'TRY';
