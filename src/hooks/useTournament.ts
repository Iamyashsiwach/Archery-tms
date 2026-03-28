"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import type { Tournament } from "@/lib/types";

export function useTournament(
  supabase: SupabaseClient | null,
  tournamentId: string | undefined
) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOne = useCallback(async () => {
    if (!supabase || !tournamentId) {
      setTournament(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();
    if (e) setError(e.message);
    else setError(null);
    setTournament((data as Tournament) ?? null);
    setLoading(false);
  }, [supabase, tournamentId]);

  useEffect(() => {
    void fetchOne();
  }, [fetchOne]);

  return { tournament, loading, error, refetch: fetchOne };
}
