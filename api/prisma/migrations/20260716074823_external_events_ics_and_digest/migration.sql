/*
  Warnings:

  - A unique constraint covering the columns `[external_event_id,user_id]` on the table `external_event_participants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ics_source_id,ics_uid]` on the table `external_events` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "external_event_participants" ADD COLUMN     "notified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "external_events" ADD COLUMN     "ics_source_id" INTEGER,
ADD COLUMN     "ics_uid" VARCHAR(255);

-- CreateTable
CREATE TABLE "external_event_ics_sources" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "external_event_ics_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_event_participants_external_event_id_user_id_key" ON "external_event_participants"("external_event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_events_ics_source_id_ics_uid_key" ON "external_events"("ics_source_id", "ics_uid");
