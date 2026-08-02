-- Adds an optional end_time to events and external_events so an event can
-- have a begin/end time range instead of a single time. Nullable and
-- additive on both tables - existing rows and whole-day events simply have
-- no end_time until edited, and this repo's blue/green deploy keeps the
-- previous release's code running against an already-migrated DB for a
-- window, and that old code ignores this new column entirely (expand/contract
-- safe, see CLAUDE.md's migration section).

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "end_time" TIME(6);
ALTER TABLE "external_events" ADD COLUMN IF NOT EXISTS "end_time" TIME(6);
