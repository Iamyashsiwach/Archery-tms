"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import type { MatchRow } from "@/lib/types";

export function useBracket(
  supabase: SupabaseClient | null,
  tournamentId: string | undefined,
  division?: string
) {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!supabase || !tournamentId) {
      setMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("match_number", { ascending: true });
    if (division) q = q.eq("division", division);
    const { data } = await q;
    setMatches((data as MatchRow[]) ?? []);
    setLoading(false);
  }, [supabase, tournamentId, division]);

  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    if (!supabase || !tournamentId) return;
    const channel = supabase
      .channel(`bracket-${tournamentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => void fetchMatches()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, tournamentId, fetchMatches]);

  return { matches, loading, refetch: fetchMatches };
}
