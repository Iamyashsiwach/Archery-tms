# Codebase index — `archery-tms`

Next.js 16 (App Router) + React 19 + Supabase + Tailwind 4. Tournament scoring, live leaderboard, brackets, coach registration, judge roster/trash.

## Entry & config

| Path | Role |
|------|------|
| `package.json` | Scripts: `dev`, `build`, `start`, `lint` |
| `next.config.ts` | Next.js config |
| `tsconfig.json` | TypeScript |
| `src/app/globals.css` | Global styles / theme tokens |
| `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_ADMIN_PIN` (see `.env.local.example`) |

## App routes (`src/app/`)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `page.tsx` | Marketing / entry links |
| `/admin` | `admin/page.tsx` | PIN-gated admin dashboard |
| `/judge` | `judge/page.tsx` | Pick tournament → judge tools |
| `/judge/[tournamentId]` | `judge/[tournamentId]/page.tsx` | Judge home (links) |
| `/judge/[tournamentId]/layout.tsx` | Optional judge access code gate |
| `/judge/.../score` | `score/page.tsx` | Qualification scoring |
| `/judge/.../targets` | `targets/page.tsx` | Target assignment UI |
| `/judge/.../match` | `match/page.tsx` | Head-to-head winner |
| `/judge/.../roster` | `roster/page.tsx` | Judge roster + trash |
| `/judge/.../register` | `register/page.tsx` | Coach-registration explainer |
| `/coach/[tournamentId]/[token]` | `coach/.../page.tsx` | Coach portal (invite) |
| `/display` | `display/page.tsx` | List / pick display |
| `/display/[tournamentId]` | `display/[tournamentId]/page.tsx` | Live leaderboard |
| `/display/.../targets` | `targets/page.tsx` | Public target board |
| `/display/.../bracket` | `bracket/page.tsx` | Bracket display |
| `/display/.../results` | `results/page.tsx` | Results |
| `/print/.../bracket` | `print/.../bracket/page.tsx` | Print bracket |
| `/print/.../results/[division]` | Print results |
| `/print/.../scoresheet/[archerId]` | Printable scoresheet |
| `layout.tsx` | Root layout: fonts, `SupabaseProvider`, `SiteNav`, `<main>` |

## Components (`src/components/`)

| Area | Files |
|------|--------|
| Shell | `SiteNav.tsx`, `SupabaseProvider.tsx` |
| Admin | `admin/AdminDashboard.tsx` |
| Coach | `coach/CoachPortal.tsx` |
| Judge | `judge/ScoreEntryView.tsx`, `MatchScoreView.tsx`, `JudgeRosterView.tsx`, `RegisterArcherView.tsx`, `JudgeAccessLayout.tsx` |
| Display | `display/LeaderboardView.tsx`, `BracketDisplayView.tsx`, `ResultsView.tsx` |
| Targets | `targets/TargetBaleBoard.tsx`, `targets/TargetsPageView.tsx` |
| Print | `print/*PrintView.tsx`, `PrintControls.tsx` |
| Shared | `LeaderboardTable.tsx`, `DivisionTabs.tsx`, `BracketTree.tsx`, `ArrowScoreButton.tsx` |

## Hooks (`src/hooks/`)

| Hook | Data |
|------|------|
| `useTournament.ts` | Single tournament row |
| `useArchers.ts` | Archers (optional `coachId`, `includeDeleted`) |
| `useScores.ts` | Scores for archer/tournament |
| `useLeaderboard.ts` | Aggregated qualification leaderboard + realtime + 30s poll |
| `useBracket.ts` | `matches` rows |

## Library (`src/lib/`)

| Module | Responsibility |
|--------|----------------|
| `supabase/client.ts` | Browser Supabase singleton |
| `types.ts` | Shared TypeScript types |
| `rulesEngine.ts` | Event configs, arrow validation, totals |
| `categoryGrouper.ts` | Divisions: Recurve / Compound / Indian + gender + age |
| `eventLabels.ts` | Indian-English labels for WA-style round formats (Admin) |
| `targetAllotment.ts` | Bale/slot assignment helpers |
| `bracketEngine.ts` | Generate elimination `matches` rows |
| `adminBracket.ts` | Admin: force bracket from qualification |
| `resultsSync.ts` | Recalc `results`, maybe generate bracket |
| `archeryTerms.ts` | Field labels (bale, slot, bracket legend) |
| `csv.ts` | CSV export helpers |

## Supabase (`supabase/`)

| File | Use |
|------|-----|
| `schema.sql` | Full schema for **new** projects |
| `policies.dev.sql` | Dev RLS-style policies (if used) |
| `migration_targets_judge.sql` | Older migration (targets / judge fields) |
| `migration_coaches_lock_trash.sql` | Coaches table + lock/trash columns |
| `run_this_if_columns_missing.sql` | **Existing** DBs: add columns without recreate |

## Data model (concise)

- **`tournaments`** — event, `event_type`, ends/arrows, `judge_access_code`, bale settings, status. (DB may still have legacy `terms_locale` column.)
- **`archers`** — `tournament_id`, division, `bale_number`, `slot_index`, `coach_id`, `registration_locked`, `deleted_at`, seeds, etc.
- **`coaches`** — invite token, `locked_at` for roster lock.
- **`scores`** — qualification / other rounds, arrows JSON, totals.
- **`results`** — cached totals per archer for ranking.
- **`matches`** — bracket rows, `winner_id`, round.

## Conventions

- Client data hooks use `"use client"` and `useSupabase()` from `SupabaseProvider`.
- Judge routes under `/judge/[tournamentId]` share `JudgeAccessLayout` where applicable.
- Soft delete: `archers.deleted_at`; judges restore via roster.

---

*Generated for navigation; update when adding routes or major folders.*
