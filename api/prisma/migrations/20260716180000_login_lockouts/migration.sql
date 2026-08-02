-- CreateTable
CREATE TABLE "login_lockouts" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "login_lockouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "index_login_lockouts_on_email" ON "login_lockouts"("email");
