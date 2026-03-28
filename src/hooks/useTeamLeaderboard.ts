"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getEventConfig } from "@/lib/rulesEngine";
import type { Team, TeamLeaderboardEntry, TeamResultRow, Tournament } from "@/lib/types";

export function useTeamLeaderboard(
  supabase: SupabaseClient | null,
  tournament: Tournament | null,
  teams: Team[]
) {
  const [entries, setEntries] = useState<TeamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const endsRequired = useMemo(() => {
    if (!tournament) return 0;
    return getEventConfig(tournament.event_type, tournament).endCount;
  }, [tournament]);

  const refetchLeaderboard = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      if (!supabase || !tournament || teams.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      const { data: res } = await supabase
        .from("team_results")
        .select("*")
        .eq("tournament_id", tournament.id);

      const byTeam = new Map<string, TeamResultRow>();
      for (const r of (res ?? []) as TeamResultRow[]) {
        byTeam.set(r.team_id, r);
      }

      const out: TeamLeaderboardEntry[] = [];
      for (const t of teams) {
        const r = byTeam.get(t.id);
        const { count } = await supabase
          .from("team_scores")
          .select("*", { count: "exact", head: true })
          .eq("team_id", t.id)
          .eq("tournament_id", tournament.id)
          .eq("round", "QUALIFICATION");

        out.push({
          team_id: t.id,
          name: t.name,
          division: t.division,
          total_score: r?.total_score ?? 0,
          total_x_count: r?.total_x_count ?? 0,
          ends_complete: count ?? 0,
          ends_required: endsRequired,
        });
      }

      setEntries(out);
      setLoading(false);
    },
    [supabase, tournament, teams, endsRequired]
  );

  useEffect(() => {
    void refetchLeaderboard();
  }, [refetchLeaderboard]);

  useEffect(() => {
    if (!supabase || !tournament) return;
    const tid = tournament.id;
    const channel = supabase
      .channel(`team-leaderboard-${tid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_scores" },
        () => void refetchLeaderboard({ silent: true })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_results" },
        () => void refetchLeaderboard({ silent: true })
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `tournament_id=eq.${tid}`,
        },
        () => void refetchLeaderboard({ silent: true })
      )
      .subscribe();

    const iv = window.setInterval(
      () => void refetchLeaderboard({ silent: true }),
      30_000
    );

    return () => {
      window.clearInterval(iv);
      void supabase.removeChannel(channel);
    };
  }, [supabase, tournament, refetchLeaderboard]);

  return { entries, loading, refetch: refetchLeaderboard, endsRequired };
}
