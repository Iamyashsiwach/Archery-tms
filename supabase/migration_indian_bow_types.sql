-- =============================================================================
-- Indian bow class INDIAN + R360 (360 round) on tournaments.
-- Run once on existing Supabase projects (SQL Editor), then reload schema.
-- =============================================================================

-- Archers: merge legacy values into INDIAN
update archers
set bow_type = 'INDIAN'
where bow_type in ('TRADITIONAL', 'BAREBOW', 'LONGBOW');

alter table archers drop constraint if exists archers_bow_type_check;

alter table archers
  add constraint archers_bow_type_check
  check (bow_type is null or bow_type in ('RECURVE','COMPOUND','INDIAN'));

-- If you previously used R610, rename to R360
update tournaments
set event_type = 'R360'
where event_type = 'R610';

-- Tournaments: allow 360 round code R360
alter table tournaments drop constraint if exists tournaments_event_type_check;

alter table tournaments
  add constraint tournaments_event_type_check
  check (
    event_type in ('WA18','WA25','WA720','R360','NFAA_FIELD','CUSTOM','WA_TEAM')
  );

notify pgrst, 'reload schema';
