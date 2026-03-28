"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import type { TeamScoreRow } from "@/lib/types";

export function useTeamScores(
  supabase: SupabaseClient | null,
  tournamentId: string | undefined,
  teamId?: string | undefined
) {
  const [scores, setScores] = useState<TeamScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!supabase || !tournamentId) {
      setScores([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase
      .from("team_scores")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("end_number", { ascending: true });
    if (teamId) q = q.eq("team_id", teamId);
    const { data } = await q;
    setScores((data as TeamScoreRow[]) ?? []);
    setLoading(false);
  }, [supabase, tournamentId, teamId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { scores, loading, refetch };
}
