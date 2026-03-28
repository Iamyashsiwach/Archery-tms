"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Archer,
  LeaderboardEntry,
  ResultRow,
  Tournament,
} from "@/lib/types";
import { getEventConfig } from "@/lib/rulesEngine";

export function useLeaderboard(
  supabase: SupabaseClient | null,
  tournament: Tournament | null,
  archers: Archer[]
) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const endsRequired = useMemo(() => {
    if (!tournament) return 0;
    const cfg =
      tournament.event_type === "CUSTOM"
        ? getEventConfig("CUSTOM", tournament)
        : getEventConfig(tournament.event_type);
    return cfg.endCount;
  }, [tournament]);

  const refetchLeaderboard = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      if (!supabase || !tournament || archers.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      const { data: res } = await supabase
        .from("results")
        .select("*")
        .eq("tournament_id", tournament.id);

      const byArcher = new Map<string, ResultRow>();
      for (const r of (res ?? []) as ResultRow[]) {
        byArcher.set(r.archer_id, r);
      }

      const out: LeaderboardEntry[] = [];
      for (const a of archers) {
        const r = byArcher.get(a.id);
        const { count } = await supabase
          .from("scores")
          .select("*", { count: "exact", head: true })
          .eq("archer_id", a.id)
          .eq("tournament_id", tournament.id)
          .eq("round", "QUALIFICATION");

        out.push({
          archer_id: a.id,
          name: a.name,
          club: a.club,
          division: a.division,
          total_score: r?.total_score ?? 0,
          total_x_count: r?.total_x_count ?? 0,
          status: a.status,
          ends_complete: count ?? 0,
          ends_required: endsRequired,
          bale_number: a.bale_number,
          slot_index: a.slot_index,
        });
      }

      setEntries(out);
      setLoading(false);
    },
    [supabase, tournament, archers, endsRequired]
  );

  useEffect(() => {
    void refetchLeaderboard();
  }, [refetchLeaderboard]);

  useEffect(() => {
    if (!supabase || !tournament) return;
    const tid = tournament.id;
    const channel = supabase
      .channel(`leaderboard-${tid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scores" },
        () => void refetchLeaderboard({ silent: true })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        () => void refetchLeaderboard({ silent: true })
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "archers",
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
