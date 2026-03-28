"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DivisionTabs } from "@/components/DivisionTabs";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { TeamLeaderboardTable } from "@/components/display/TeamLeaderboardTable";
import { useArchers } from "@/hooks/useArchers";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useTeamLeaderboard } from "@/hooks/useTeamLeaderboard";
import { useTeams } from "@/hooks/useTeams";
import { useTournament } from "@/hooks/useTournament";
import { groupArchersByDivision } from "@/lib/categoryGrouper";
import { useSupabase } from "@/components/SupabaseProvider";
import type { Tournament } from "@/lib/types";

export function ResultsView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { tournament, loading: tournamentLoading } = useTournament(
    supabase,
    tournamentId
  );

  if (!supabase) {
    return <p className="p-6 text-danger">Configure Supabase.</p>;
  }

  if (tournamentLoading || !tournament) {
    return <p className="p-6 text-secondary">Loading…</p>;
  }

  if (tournament.event_type === "WA_TEAM") {
    return (
      <TeamResultsView tournamentId={tournamentId} tournament={tournament} />
    );
  }

  return (
    <IndividualResultsView tournamentId={tournamentId} tournament={tournament} />
  );
}

function TeamResultsView({
  tournamentId,
  tournament,
}: {
  tournamentId: string;
  tournament: Tournament;
}) {
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

  const [active, setActive] = useState("");

  useEffect(() => {
    if (divisions.length && (!active || !divisions.includes(active))) {
      setActive(divisions[0]);
    }
  }, [divisions, active]);

  const filtered = entries.filter((e) => (e.division ?? "") === active);
  const loading = teamsLoading || lbLoading;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/display/${tournamentId}`} className="text-sm text-accent">
        ← Leaderboard
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold">Results</h1>
      <p className="text-secondary">{tournament.name}</p>
      <p className="mt-2 text-xs text-secondary">
        Team totals (WA team event).
      </p>
      {divisions.length > 0 && (
        <div className="mt-6">
          <DivisionTabs divisions={divisions} active={active} onChange={setActive} />
        </div>
      )}
      {loading ? (
        <p className="mt-8">Loading…</p>
      ) : (
        <div className="mt-6">
          <TeamLeaderboardTable division={active} rows={filtered} />
        </div>
      )}
    </div>
  );
}

function IndividualResultsView({
  tournamentId,
  tournament,
}: {
  tournamentId: string;
  tournament: Tournament;
}) {
  const supabase = useSupabase();
  const { archers } = useArchers(supabase, tournamentId);
  const { entries, loading } = useLeaderboard(supabase, tournament, archers);
  const divisions = useMemo(() => {
    const g = groupArchersByDivision(archers);
    return Object.keys(g).sort();
  }, [archers]);
  const [active, setActive] = useState("");

  useEffect(() => {
    if (divisions.length && (!active || !divisions.includes(active))) {
      setActive(divisions[0]);
    }
  }, [divisions, active]);

  const filtered = entries.filter((e) => e.division === active);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/display/${tournamentId}`} className="text-sm text-accent">
        ← Leaderboard
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold">Results</h1>
      <p className="text-secondary">{tournament.name}</p>
      {divisions.length > 0 && (
        <div className="mt-6">
          <DivisionTabs divisions={divisions} active={active} onChange={setActive} />
        </div>
      )}
      {loading ? (
        <p className="mt-8">Loading…</p>
      ) : (
        <div className="mt-6 space-y-4">
          <LeaderboardTable division={active} rows={filtered} topN={999} />
          <Link
            className="inline-block rounded-lg border border-border px-4 py-2 text-sm hover:border-accent"
            href={`/print/${tournamentId}/results/${encodeURIComponent(active)}`}
          >
            Printable results
          </Link>
        </div>
      )}
    </div>
  );
}
