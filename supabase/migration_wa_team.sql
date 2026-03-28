-- WA team round: team-level qualification scoring (6 arrows/end, cumulative).
-- Run once in Supabase SQL Editor on existing projects. New installs: schema.sql includes this.

alter table tournaments drop constraint if exists tournaments_event_type_check;
alter table tournaments add constraint tournaments_event_type_check check (
  event_type in ('WA18','WA25','WA720','R360','NFAA_FIELD','CUSTOM','WA_TEAM')
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  division text,
  created_at timestamptz default now()
);

create index if not exists idx_teams_tournament on teams(tournament_id);

create table if not exists team_scores (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round text not null check (round in ('QUALIFICATION','ELIMINATION','FINAL')),
  end_number int not null,
  arrows jsonb not null,
  end_total int not null,
  x_count int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_team_scores_tournament on team_scores(tournament_id);
create index if not exists idx_team_scores_team on team_scores(team_id);

create table if not exists team_results (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  division text,
  final_rank int,
  total_score int default 0,
  total_x_count int default 0,
  created_at timestamptz default now(),
  unique (team_id, tournament_id)
);

create index if not exists idx_team_results_tournament on team_results(tournament_id);

notify pgrst, 'reload schema';
