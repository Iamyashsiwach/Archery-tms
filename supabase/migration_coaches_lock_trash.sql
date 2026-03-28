-- Coaches (invite links), archer lock + soft-delete, tournament terms locale.
-- Run in Supabase SQL Editor once. Then: notify pgrst, 'reload schema';

create table if not exists coaches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  display_name text not null,
  club text,
  invite_token uuid not null default gen_random_uuid() unique,
  locked_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_coaches_tournament on coaches(tournament_id);

alter table tournaments
  add column if not exists terms_locale text default 'BOTH';

alter table archers
  add column if not exists coach_id uuid references coaches(id) on delete set null;

alter table archers
  add column if not exists registration_locked boolean default false;

alter table archers
  add column if not exists deleted_at timestamptz;

notify pgrst, 'reload schema';
