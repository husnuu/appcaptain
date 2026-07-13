-- Calendar availability: captain-defined blocks + per-day/slot price overrides.
-- Written idempotently to reconcile an earlier `db push` that created a divergent
-- `calendar_blocks` (with a legacy `model` column + `createdById` uuid) directly
-- in production without a migration record.

DO $$ BEGIN
  CREATE TYPE "BlockReason" AS ENUM ('MAINTENANCE', 'OWNER_USE', 'MANUAL', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Fresh DBs: create the table in its final shape.
CREATE TABLE IF NOT EXISTS "calendar_blocks" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "reason" "BlockReason" NOT NULL DEFAULT 'MANUAL',
    "note" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_blocks_pkey" PRIMARY KEY ("id")
);

-- Drifted DBs: drop the legacy per-block model column (blocks are model-agnostic).
ALTER TABLE "calendar_blocks" DROP COLUMN IF EXISTS "model";

-- Drifted DBs: migrate createdById (uuid) -> createdBy (text), preserving data.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calendar_blocks' AND column_name = 'createdById'
  ) THEN
    ALTER TABLE "calendar_blocks" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
    UPDATE "calendar_blocks" SET "createdBy" = "createdById"::text WHERE "createdBy" IS NULL;
    ALTER TABLE "calendar_blocks" ALTER COLUMN "createdBy" SET NOT NULL;
    ALTER TABLE "calendar_blocks" DROP COLUMN "createdById";
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE "calendar_blocks"
    ADD CONSTRAINT "calendar_blocks_boatId_fkey" FOREIGN KEY ("boatId")
    REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "calendar_blocks_boatId_startDate_endDate_idx"
  ON "calendar_blocks"("boatId", "startDate", "endDate");

CREATE TABLE IF NOT EXISTS "calendar_price_overrides" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_price_overrides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "calendar_price_overrides_boatId_date_startTime_endTime_key"
  ON "calendar_price_overrides"("boatId", "date", "startTime", "endTime");
CREATE INDEX IF NOT EXISTS "calendar_price_overrides_boatId_date_idx"
  ON "calendar_price_overrides"("boatId", "date");

DO $$ BEGIN
  ALTER TABLE "calendar_price_overrides"
    ADD CONSTRAINT "calendar_price_overrides_boatId_fkey" FOREIGN KEY ("boatId")
    REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
