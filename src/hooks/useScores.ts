"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import type { ScoreRow } from "@/lib/types";

export function useScores(
  supabase: SupabaseClient | null,
  tournamentId: string | undefined,
  archerId?: string | undefined
) {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    if (!supabase || !tournamentId) {
      setScores([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase
      .from("scores")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("end_number", { ascending: true });
    if (archerId) q = q.eq("archer_id", archerId);
    const { data } = await q;
    setScores((data as ScoreRow[]) ?? []);
    setLoading(false);
  }, [supabase, tournamentId, archerId]);

  useEffect(() => {
    void fetchScores();
  }, [fetchScores]);

  return { scores, loading, refetch: fetchScores };
}
