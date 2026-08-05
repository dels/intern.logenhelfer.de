-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthday_calendar_consent" BOOLEAN NOT NULL DEFAULT false;
