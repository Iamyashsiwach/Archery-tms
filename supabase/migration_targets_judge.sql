-- Run once in Supabase SQL Editor if you already applied the original schema.sql
-- (safe to re-run: uses IF NOT EXISTS)

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
