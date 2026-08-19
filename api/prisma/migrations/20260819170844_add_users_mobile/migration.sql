-- AlterTable
-- Nullable, no DEFAULT - unlike birthday_calendar_token there is no
-- "every row needs one" invariant for `mobile`; NULL is a valid final
-- answer for a user with no address-derived mobile at all. The backfill
-- UPDATE below (not a DEFAULT) is what populates existing rows, using the
-- exact same three-tier priority as `computeUserMobile`
-- (api/src/lib/userMobile.ts) so the one-time backfill and the ongoing JS
-- sync (address create/update/delete, wired in a later migration-adjacent
-- task) agree.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mobile" VARCHAR(255);

-- Backfill: for every existing user, derive `mobile` from their own
-- `User`-typed addresses (Seeker addresses are explicitly out of scope for
-- this feature) via three correlated subqueries, in priority order:
--   1) the lowest-id private address (type_of_address = 0) with a
--      non-blank mobile,
--   2) else the lowest-id business address (type_of_address = 1) with a
--      non-blank mobile,
--   3) else the lowest-id address of ANY other type with a non-blank
--      mobile,
--   4) else leave NULL (the column already defaults to NULL, so no row is
--      left unhandled by this UPDATE).
-- A scalar subquery with no matching rows evaluates to NULL, so
-- COALESCE(tier1, tier2, tier3) correctly falls through in priority order.
-- `addresses.deleted` is a nullable boolean column (`Boolean?`) -
-- COALESCE(deleted, false) treats a NULL `deleted` the same as `false`
-- (i.e. NOT deleted) rather than silently excluding those rows, matching
-- `computeUserMobile`'s own `deleted !== true` check exactly. A blank or
-- whitespace-only mobile is treated as absent via `trim(mobile) <> ''`,
-- mirroring the `isPresent()` convention used throughout this codebase.
-- Every user row is considered here regardless of the user's own `deleted`
-- flag - `computeUserMobile`'s contract only inspects addresses, not the
-- owning user's own deleted state, so the backfill mirrors that exactly.
UPDATE "users" u
SET "mobile" = COALESCE(
  (
    SELECT a.mobile FROM "addresses" a
    WHERE a.addressable_type = 'User' AND a.addressable_id = u.id
      AND COALESCE(a.deleted, false) = false
      AND a.type_of_address = 0
      AND a.mobile IS NOT NULL AND trim(a.mobile) <> ''
    ORDER BY a.id ASC LIMIT 1
  ),
  (
    SELECT a.mobile FROM "addresses" a
    WHERE a.addressable_type = 'User' AND a.addressable_id = u.id
      AND COALESCE(a.deleted, false) = false
      AND a.type_of_address = 1
      AND a.mobile IS NOT NULL AND trim(a.mobile) <> ''
    ORDER BY a.id ASC LIMIT 1
  ),
  (
    SELECT a.mobile FROM "addresses" a
    WHERE a.addressable_type = 'User' AND a.addressable_id = u.id
      AND COALESCE(a.deleted, false) = false
      AND a.mobile IS NOT NULL AND trim(a.mobile) <> ''
    ORDER BY a.id ASC LIMIT 1
  )
);
