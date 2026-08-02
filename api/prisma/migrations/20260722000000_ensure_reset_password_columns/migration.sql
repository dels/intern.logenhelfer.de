-- Defensive re-assertion of users.reset_password_token/reset_password_sent_at
-- (Devise's original recoverable columns), which 0_init_baseline already
-- declares - added here as cheap insurance against the exact failure mode
-- documented in 20260720230000_create_impersonation_events_table: a column
-- present in schema.prisma/baseline that turns out to be missing on some
-- real environment's actual database, silently reported "up to date" by
-- `prisma migrate deploy` because it only compares migration history, not
-- live schema. All statements are idempotent (IF NOT EXISTS), so this is a
-- no-op everywhere baseline actually ran correctly.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_token" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_sent_at" TIMESTAMP(6);

CREATE UNIQUE INDEX IF NOT EXISTS "index_users_on_reset_password_token" ON "users"("reset_password_token");
