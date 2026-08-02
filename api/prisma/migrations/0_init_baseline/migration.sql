-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "academic_titles" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "short" VARCHAR(255),
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "academic_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" SERIAL NOT NULL,
    "addressable_id" INTEGER,
    "addressable_type" VARCHAR(255),
    "purpose" VARCHAR(255) DEFAULT 'geschäftlich',
    "street1" VARCHAR(255),
    "street2" VARCHAR(255),
    "street3" VARCHAR(255),
    "zip" VARCHAR(255),
    "city" VARCHAR(255),
    "phone" VARCHAR(255),
    "fax" VARCHAR(255),
    "email" VARCHAR(255),
    "remarks" TEXT,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "type_of_address" INTEGER,
    "mobile" VARCHAR(255),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "announcement_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(255),
    "title" VARCHAR(255),
    "message_body" TEXT,
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config_adapters" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(255),
    "value" TEXT,

    CONSTRAINT "app_config_adapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_internal_metadata" (
    "key" VARCHAR NOT NULL,
    "value" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "ar_internal_metadata_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "attached_file_roles" (
    "id" SERIAL NOT NULL,
    "attached_file_id" INTEGER,
    "role_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "attached_file_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attached_files" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(36),
    "filename" VARCHAR(255),
    "content" BYTEA,
    "content_type" VARCHAR(255),
    "directory_id" INTEGER,
    "uploader_id" INTEGER,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "content_length" INTEGER DEFAULT -1,

    CONSTRAINT "attached_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "slug" VARCHAR(255),
    "uuid" VARCHAR,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_roles" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER,
    "role_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "category_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "category_id" INTEGER,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "slug" VARCHAR(255),
    "uuid" VARCHAR,

    CONSTRAINT "directories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directory_roles" (
    "id" SERIAL NOT NULL,
    "directory_id" INTEGER,
    "role_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "directory_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(255),
    "name" VARCHAR(255),
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "event_id" INTEGER,
    "festive_board" BOOLEAN DEFAULT false,
    "subscription_confirmed" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "public_description" TEXT,
    "private_description" TEXT,
    "whole_day" BOOLEAN,
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME(6),
    "uuid" VARCHAR(36),
    "location" VARCHAR(255),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_event_participants" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "external_event_id" INTEGER,
    "subscription_confirmed" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "festive_board" BOOLEAN DEFAULT false,

    CONSTRAINT "external_event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_events" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(255),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(255) NOT NULL,
    "time" TIME(6) NOT NULL,
    "date" DATE NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "updated_by_id" INTEGER,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "host" VARCHAR(255),

    CONSTRAINT "external_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_downloads" (
    "id" SERIAL NOT NULL,
    "attached_file_id" INTEGER,
    "user_id" INTEGER,
    "remote_ip" VARCHAR(255),
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "filename" VARCHAR(255),

    CONSTRAINT "file_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendly_id_slugs" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR NOT NULL,
    "sluggable_id" INTEGER NOT NULL,
    "sluggable_type" VARCHAR(50),
    "scope" VARCHAR,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "friendly_id_slugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impersonation_events" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "remote_ip" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "impersonation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lodges" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(255),
    "name" VARCHAR(255),
    "description" TEXT,
    "district_id" INTEGER,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "lodges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "officers" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(255),
    "lodge_id" INTEGER,
    "firstname" VARCHAR(255),
    "lastname" VARCHAR(255),
    "role_id" INTEGER,
    "role_email" VARCHAR(255),
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "officers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_digest" VARCHAR NOT NULL,
    "family_id" VARCHAR NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "consumed_at" TIMESTAMP(6),
    "revoked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "display_name" VARCHAR(255),
    "group" BOOLEAN DEFAULT false,
    "administrational_role" BOOLEAN DEFAULT true,
    "email" VARCHAR(255),
    "ordering_number" INTEGER,
    "deleted" BOOLEAN DEFAULT false,
    "admin_role" BOOLEAN DEFAULT false,
    "officer_role" BOOLEAN DEFAULT false,
    "index" INTEGER,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_migrations" (
    "version" VARCHAR NOT NULL,

    CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "seekers" (
    "id" SERIAL NOT NULL,
    "firstname" VARCHAR(255),
    "lastname" VARCHAR(255),
    "source" VARCHAR(255),
    "invite" BOOLEAN,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "uuid" VARCHAR(36),
    "preferred_way_of_contact" INTEGER,
    "status" INTEGER,
    "notes" TEXT,

    CONSTRAINT "seekers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "role_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "role_added_at" DATE,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL DEFAULT '',
    "encrypted_password" VARCHAR(255) NOT NULL DEFAULT '',
    "reset_password_token" VARCHAR(255),
    "reset_password_sent_at" TIMESTAMP(6),
    "remember_created_at" TIMESTAMP(6),
    "sign_in_count" INTEGER DEFAULT 0,
    "current_sign_in_at" TIMESTAMP(6),
    "last_sign_in_at" TIMESTAMP(6),
    "current_sign_in_ip" VARCHAR(255),
    "last_sign_in_ip" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "uuid" VARCHAR(255),
    "firstname" VARCHAR(255),
    "lastname" VARCHAR(255),
    "date_of_birth" DATE,
    "accepted_at" DATE,
    "deleted" BOOLEAN DEFAULT false,
    "matriculation_number" INTEGER,
    "job_title" VARCHAR(255),
    "title" INTEGER,
    "academic_title_id" INTEGER,
    "mother_lodge" VARCHAR(255),
    "provider" VARCHAR(255),
    "g_uid" VARCHAR(255),
    "g_name" VARCHAR(255),
    "g_mail" VARCHAR(255),
    "oauth_token" VARCHAR(255),
    "oauth_expires_at" TIMESTAMP(6),
    "accepted_gdpr" BOOLEAN DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "index_academic_titles_on_title" ON "academic_titles"("title");

-- CreateIndex
CREATE UNIQUE INDEX "index_academic_titles_on_short" ON "academic_titles"("short");

-- CreateIndex
CREATE INDEX "index_announcement_subscriptions_on_user_id" ON "announcement_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "index_app_config_adapters_on_key" ON "app_config_adapters"("key");

-- CreateIndex
CREATE INDEX "index_attached_file_roles_on_attached_file_id" ON "attached_file_roles"("attached_file_id");

-- CreateIndex
CREATE INDEX "index_attached_file_roles_on_role_id" ON "attached_file_roles"("role_id");

-- CreateIndex
CREATE INDEX "index_attached_files_on_deleted" ON "attached_files"("deleted");

-- CreateIndex
CREATE INDEX "index_attached_files_on_directory_id" ON "attached_files"("directory_id");

-- CreateIndex
CREATE INDEX "index_attached_files_on_filename" ON "attached_files"("filename");

-- CreateIndex
CREATE INDEX "index_categories_on_slug" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "index_categories_on_uuid" ON "categories"("uuid");

-- CreateIndex
CREATE INDEX "index_category_roles_on_category_id" ON "category_roles"("category_id");

-- CreateIndex
CREATE INDEX "index_category_roles_on_role_id" ON "category_roles"("role_id");

-- CreateIndex
CREATE INDEX "index_directories_on_category_id" ON "directories"("category_id");

-- CreateIndex
CREATE INDEX "index_directories_on_deleted" ON "directories"("deleted");

-- CreateIndex
CREATE INDEX "index_directories_on_slug" ON "directories"("slug");

-- CreateIndex
CREATE INDEX "index_directories_on_uuid" ON "directories"("uuid");

-- CreateIndex
CREATE INDEX "index_directory_roles_on_directory_id" ON "directory_roles"("directory_id");

-- CreateIndex
CREATE INDEX "index_directory_roles_on_role_id" ON "directory_roles"("role_id");

-- CreateIndex
CREATE INDEX "index_events_on_created_by_id" ON "events"("created_by_id");

-- CreateIndex
CREATE INDEX "index_events_on_updated_by_id" ON "events"("updated_by_id");

-- CreateIndex
CREATE INDEX "index_file_downloads_on_deleted" ON "file_downloads"("deleted");

-- CreateIndex
CREATE INDEX "index_file_downloads_on_user_id" ON "file_downloads"("user_id");

-- CreateIndex
CREATE INDEX "index_friendly_id_slugs_on_slug_and_sluggable_type" ON "friendly_id_slugs"("slug", "sluggable_type");

-- CreateIndex
CREATE INDEX "index_friendly_id_slugs_on_sluggable_id" ON "friendly_id_slugs"("sluggable_id");

-- CreateIndex
CREATE INDEX "index_friendly_id_slugs_on_sluggable_type" ON "friendly_id_slugs"("sluggable_type");

-- CreateIndex
CREATE UNIQUE INDEX "index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope" ON "friendly_id_slugs"("slug", "sluggable_type", "scope");

-- CreateIndex
CREATE INDEX "index_impersonation_events_on_admin_id" ON "impersonation_events"("admin_id");

-- CreateIndex
CREATE INDEX "index_impersonation_events_on_user_id" ON "impersonation_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "index_refresh_tokens_on_token_digest" ON "refresh_tokens"("token_digest");

-- CreateIndex
CREATE INDEX "index_refresh_tokens_on_family_id" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "index_refresh_tokens_on_user_id" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "index_users_on_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "index_users_on_reset_password_token" ON "users"("reset_password_token");

-- CreateIndex
CREATE INDEX "index_users_on_uuid" ON "users"("uuid");

