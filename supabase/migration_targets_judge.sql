-- Run once in Supabase SQL Editor if you already applied an OLDER schema.sql
-- (same as supabase/run_this_if_columns_missing.sql — safe to re-run)

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

notify pgrst, 'reload schema';
