-- Optional: permissive policies for local development with the anon key.
-- Review and tighten before production.

alter table tournaments enable row level security;
alter table archers enable row level security;
alter table scores enable row level security;
alter table matches enable row level security;
alter table results enable row level security;
alter table coaches enable row level security;

create policy "dev tournaments all" on tournaments for all using (true) with check (true);
create policy "dev archers all" on archers for all using (true) with check (true);
create policy "dev scores all" on scores for all using (true) with check (true);
create policy "dev matches all" on matches for all using (true) with check (true);
create policy "dev results all" on results for all using (true) with check (true);
create policy "dev coaches all" on coaches for all using (true) with check (true);
