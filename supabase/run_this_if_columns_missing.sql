-- =============================================================================
-- FIX: "Could not find the 'archers_per_bale' column ... in the schema cache"
-- =============================================================================
-- You already have tables from an older schema. Run THIS file once (not the
-- full schema.sql, which only "creates if not exists" and won't alter old tables).
--
-- Supabase → SQL Editor → New query → paste all of this → Run
-- Then hard-refresh the Admin page in your browser.
-- =============================================================================

alter table tournaments
  add column if not exists judge_access_code text;

alter table tournaments
  add column if not exists archers_per_bale int default 4;

alter table tournaments
  add column if not exists bale_count int;

alter table archers
  add column if not exists bale_number int;

alter table archers
  add column if not exists slot_index int;

-- Refresh API schema (fixes PostgREST "schema cache" errors)
notify pgrst, 'reload schema';
