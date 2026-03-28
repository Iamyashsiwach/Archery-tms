"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DivisionTabs } from "@/components/DivisionTabs";
import { TeamLeaderboardTable } from "@/components/display/TeamLeaderboardTable";
import { useTeamLeaderboard } from "@/hooks/useTeamLeaderboard";
import { useTeams } from "@/hooks/useTeams";
import { useSupabase } from "@/components/SupabaseProvider";
import type { Tournament } from "@/lib/types";

const navLink =
  "rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm font-heading uppercase tracking-wide text-accent transition hover:border-accent";

type Props = {
  tournamentId: string;
  tournament: Tournament;
};

export function TeamLeaderboardView({ tournamentId, tournament }: Props) {
  const supabase = useSupabase();
  const { teams, loading: teamsLoading } = useTeams(supabase, tournamentId);
  const { entries, loading: lbLoading } = useTeamLeaderboard(
    supabase,
    tournament,
    teams
  );

  const divisions = useMemo(() => {
    const set = new Set<string>();
    for (const t of teams) {
      set.add(t.division?.trim() || "");
    }
    return [...set].sort((a, b) => {
      if (a === "") return 1;
      if (b === "") return -1;
      return a.localeCompare(b);
    });
  }, [teams]);

  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (divisions.length && !divisions.includes(active)) {
      setActive(divisions[0]);
    }
  }, [divisions, active]);

  const filtered = entries.filter((e) => (e.division ?? "") === active);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/display/${tournamentId}`
      : "";

  const loading = teamsLoading || lbLoading;

  if (!supabase) {
    return <p className="p-6 text-danger">Configure Supabase.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="sticky top-[52px] z-30 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-md print:static print:border-0 print:bg-transparent">
        <p className="text-center text-xs text-secondary">
          WA team event — live team totals (no individual elimination bracket).
        </p>
        <nav className="mt-3 flex flex-wrap items-center justify-center gap-2 print:hidden">
          <Link className={navLink} href={`/display/${tournamentId}/targets`}>
            Targets
          </Link>
          <Link className={navLink} href={`/display/${tournamentId}/results`}>
            Results
          </Link>
        </nav>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">
            Team leaderboard
          </h1>
          <p className="mt-1 text-secondary">{tournament.name}</p>
        </div>
        {url && (
          <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 print:hidden">
            <QRCodeSVG
              value={url}
              size={96}
              fgColor="#e8a020"
              bgColor="#141414"
            />
            <div className="max-w-[200px]">
              <p className="font-mono text-[10px] break-all text-secondary">
                {url}
              </p>
            </div>
          </div>
        )}
      </div>

      {teams.length === 0 && !teamsLoading ? (
        <p className="mt-8 text-secondary">
          No teams yet. Add teams in Admin for this tournament, then enter scores
          under Judge → Enter scores.
        </p>
      ) : (
        <>
          {divisions.length > 0 && (
            <div className="mt-6">
              <DivisionTabs
                divisions={divisions}
                active={active}
                onChange={setActive}
              />
            </div>
          )}

          {loading ? (
            <p className="mt-8 text-secondary">Loading…</p>
          ) : (
            <div className="mt-6">
              <TeamLeaderboardTable division={active} rows={entries} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
