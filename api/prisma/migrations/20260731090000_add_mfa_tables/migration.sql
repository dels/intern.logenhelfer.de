-- CreateTable
CREATE TABLE "mfa_totp_credentials" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "encrypted_secret" VARCHAR NOT NULL,
    "verified_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "mfa_totp_credentials_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "index_mfa_totp_credentials_on_user_id" ON "mfa_totp_credentials"("user_id");

-- CreateTable
CREATE TABLE "mfa_email_credentials" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "verified_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "mfa_email_credentials_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "index_mfa_email_credentials_on_user_id" ON "mfa_email_credentials"("user_id");

-- CreateTable
CREATE TABLE "mfa_email_otp_codes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "purpose" VARCHAR(20) NOT NULL,
    "code_hash" VARCHAR NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "consumed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "mfa_email_otp_codes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "index_mfa_email_otp_codes_on_user_id" ON "mfa_email_otp_codes"("user_id");

-- CreateTable
CREATE TABLE "mfa_passkey_credentials" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "credential_id" VARCHAR NOT NULL,
    "public_key" VARCHAR NOT NULL,
    "sign_count" INTEGER NOT NULL DEFAULT 0,
    "name" VARCHAR(255) NOT NULL,
    "last_used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "mfa_passkey_credentials_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "index_mfa_passkey_credentials_on_credential_id" ON "mfa_passkey_credentials"("credential_id");
CREATE INDEX "index_mfa_passkey_credentials_on_user_id" ON "mfa_passkey_credentials"("user_id");

-- CreateTable
CREATE TABLE "mfa_backup_codes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code_hash" VARCHAR NOT NULL,
    "used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "mfa_backup_codes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "index_mfa_backup_codes_on_user_id" ON "mfa_backup_codes"("user_id");

-- CreateTable
CREATE TABLE "mfa_trusted_devices" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_token_hash" VARCHAR NOT NULL,
    "user_agent" VARCHAR,
    "last_ip" VARCHAR,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "mfa_trusted_devices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "index_mfa_trusted_devices_on_device_token_hash" ON "mfa_trusted_devices"("device_token_hash");
CREATE INDEX "index_mfa_trusted_devices_on_user_id" ON "mfa_trusted_devices"("user_id");

-- CreateTable
CREATE TABLE "mfa_lockouts" (
    "id" SERIAL NOT NULL,
    "subject_key" VARCHAR(255) NOT NULL,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "mfa_lockouts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "index_mfa_lockouts_on_subject_key" ON "mfa_lockouts"("subject_key");

-- CreateTable
CREATE TABLE "mfa_reset_events" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "mfa_reset_events_pkey" PRIMARY KEY ("id")
);
