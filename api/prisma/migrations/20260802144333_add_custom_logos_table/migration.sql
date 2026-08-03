-- CreateTable
CREATE TABLE "custom_logos" (
    "id" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "content_type" VARCHAR(255) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_logos_pkey" PRIMARY KEY ("id")
);
