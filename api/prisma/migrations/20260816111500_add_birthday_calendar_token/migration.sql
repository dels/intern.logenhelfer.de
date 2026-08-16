-- AlterTable
-- Volatile DEFAULT (gen_random_uuid(), built into Postgres core since v13 -
-- no pgcrypto extension needed) forces a full table rewrite rather than the
-- fast metadata-only ADD COLUMN path, but that's exactly what's wanted here:
-- every existing row gets backfilled with its OWN distinct random token in
-- the same statement, not one shared value copied to every row.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthday_calendar_token" VARCHAR(255) NOT NULL DEFAULT gen_random_uuid()::text;

-- CreateIndex
CREATE UNIQUE INDEX "index_users_on_birthday_calendar_token" ON "users"("birthday_calendar_token");
