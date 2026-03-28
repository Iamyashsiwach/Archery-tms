-- 1) NEW project: SQL Editor → paste this file → Run.
-- 2) EXISTING project (tables already created): do NOT re-run only this file for new
--    columns — run supabase/run_this_if_columns_missing.sql instead, then reload Admin.
-- 3) If the API still errors after DDL, run: notify pgrst, 'reload schema';
-- 3) Dashboard → Database → Replication: enable Realtime for `scores` and `results`.
-- 4) If API returns 401/permission errors, run supabase/policies.dev.sql (dev only).

create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  status text default 'REGISTRATION'
    check (status in ('REGISTRATION','QUALIFICATION','ELIMINATION','FINALS','COMPLETE')),
  event_type text not null
    check (event_type in ('WA18','WA25','WA720','NFAA_FIELD','CUSTOM')),
  arrows_per_end int not null,
  end_count int not null,
  max_arrow_score int not null,
  distance_meters int,
  judge_access_code text,
  archers_per_bale int default 4,
  bale_count int,
  created_at timestamptz default now()
);

create table if not exists archers (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  club text,
  age_category text check (age_category in ('U18','U21','SENIOR','MASTER','VETERAN')),
  gender text check (gender in ('M','F','X')),
  bow_type text check (bow_type in ('RECURVE','COMPOUND','BAREBOW','LONGBOW')),
  division text,
  seed_rank int,
  bale_number int,
  slot_index int,
  status text default 'ACTIVE',
  created_at timestamptz default now()
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  archer_id uuid not null references archers(id) on delete cascade,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round text not null check (round in ('QUALIFICATION','ELIMINATION','FINAL')),
  end_number int not null,
  arrows jsonb not null,
  end_total int not null,
  x_count int default 0,
  created_at timestamptz default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round text,
  match_number int,
  division text,
  archer1_id uuid references archers(id),
  archer2_id uuid references archers(id),
  winner_id uuid references archers(id),
  set_points_1 int default 0,
  set_points_2 int default 0,
  status text default 'PENDING'
    check (status in ('PENDING','ACTIVE','COMPLETE')),
  created_at timestamptz default now()
);

create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  archer_id uuid not null references archers(id) on delete cascade,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  division text,
  final_rank int,
  total_score int default 0,
  total_x_count int default 0,
  medal text check (medal is null or medal in ('GOLD','SILVER','BRONZE')),
  created_at timestamptz default now(),
  unique (archer_id, tournament_id)
);

create index if not exists idx_archers_tournament on archers(tournament_id);
create index if not exists idx_scores_tournament on scores(tournament_id);
create index if not exists idx_scores_archer on scores(archer_id);
create index if not exists idx_matches_tournament on matches(tournament_id);
create index if not exists idx_results_tournament on results(tournament_id);

-- Tell PostgREST to reload the schema cache (fixes "Could not find the table ... in the schema cache")
notify pgrst, 'reload schema';
