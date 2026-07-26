-- Preserve invitation name in fullName; store self-reported name separately.
-- Idempotent: safe if column/backfill was applied manually on prod.
ALTER TABLE "Guest" ADD COLUMN IF NOT EXISTS "name_guest" TEXT;

UPDATE "Guest" SET "name_guest" = "fullName" WHERE "name_guest" IS NULL;
