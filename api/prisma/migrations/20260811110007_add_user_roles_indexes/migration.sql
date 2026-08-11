-- CreateIndex
-- IF NOT EXISTS: same defensive pattern as
-- 20260722000000_ensure_reset_password_columns, since user_roles is a
-- pre-existing baseline table that could have drifted on some real
-- environment - a no-op everywhere baseline actually ran correctly.
CREATE INDEX IF NOT EXISTS "index_user_roles_on_user_id" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "index_user_roles_on_role_id" ON "user_roles"("role_id");
