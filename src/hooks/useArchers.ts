"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import type { Archer } from "@/lib/types";
import { getDivision } from "@/lib/categoryGrouper";

export function useArchers(
  supabase: SupabaseClient | null,
  tournamentId: string | undefined
) {
  const [archers, setArchers] = useState<Archer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchers = useCallback(async () => {
    if (!supabase || !tournamentId) {
      setArchers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase
      .from("archers")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("name");
    if (e) setError(e.message);
    else setError(null);
    setArchers((data as Archer[]) ?? []);
    setLoading(false);
  }, [supabase, tournamentId]);

  useEffect(() => {
    void fetchArchers();
  }, [fetchArchers]);

  async function registerArcher(payload: {
    tournament_id: string;
    name: string;
    club: string | null;
    age_category: Archer["age_category"];
    gender: Archer["gender"];
    bow_type: Archer["bow_type"];
    status?: string;
  }) {
    if (!supabase) throw new Error("No supabase");
    const division = getDivision(
      payload.bow_type,
      payload.gender,
      payload.age_category
    );
    const { error: insErr, data } = await supabase
      .from("archers")
      .insert({
        tournament_id: payload.tournament_id,
        name: payload.name,
        club: payload.club,
        age_category: payload.age_category,
        gender: payload.gender,
        bow_type: payload.bow_type,
        division,
        status: payload.status ?? "ACTIVE",
      })
      .select()
      .single();
    if (insErr) throw insErr;
    await fetchArchers();
    return data as Archer;
  }

  return { archers, loading, error, refetch: fetchArchers, registerArcher };
}
