-- Re-creates `impersonation_events`, which `0_init_baseline` declares but
-- never actually ran on at least prod (confirmed via prod logs, 2026-07-20):
-- `prisma migrate resolve --applied 0_init_baseline` was used to seed the
-- migration history against a database that was missing this table at the
-- time, so `prisma migrate deploy` has reported "up to date" ever since
-- while `POST /api/v1/members/:uuid/impersonate` 500s with Prisma error
-- P2021 ("table does not exist"). All statements are idempotent
-- (IF NOT EXISTS) so this is a no-op on any environment (local/test/next)
-- where the table already exists from baseline running correctly.

-- CreateTable
CREATE TABLE IF NOT EXISTS "impersonation_events" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "remote_ip" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "impersonation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "index_impersonation_events_on_admin_id" ON "impersonation_events"("admin_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "index_impersonation_events_on_user_id" ON "impersonation_events"("user_id");
