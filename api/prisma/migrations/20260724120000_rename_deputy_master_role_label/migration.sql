-- "zug. Meister" is a wrong abbreviation for the deputy-master office - the
-- correct short form is "zug. MvSt" ("zugeordneter Meister vom Stuhl").
-- Naturally idempotent: once applied, display_name no longer matches the
-- WHERE clause, so re-running this migration (or running it on an
-- environment that never had the old label) is a no-op.
UPDATE "roles" SET "display_name" = 'zug. MvSt', "updated_at" = NOW() WHERE "display_name" = 'zug. Meister';
