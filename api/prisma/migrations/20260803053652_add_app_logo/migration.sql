-- CreateTable
CREATE TABLE "app_logo" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "original" BYTEA NOT NULL,
    "original_mime" VARCHAR(255) NOT NULL,
    "icon_192" BYTEA NOT NULL,
    "icon_512" BYTEA NOT NULL,
    "icon_512_maskable" BYTEA NOT NULL,
    "apple_touch_icon" BYTEA NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "app_logo_pkey" PRIMARY KEY ("id")
);
