"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import type { Team } from "@/lib/types";

export function useTeams(
  supabase: SupabaseClient | null,
  tournamentId: string | undefined
) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!supabase || !tournamentId) {
      setTeams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("name", { ascending: true });
    setTeams((data as Team[]) ?? []);
    setLoading(false);
  }, [supabase, tournamentId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { teams, loading, refetch };
}
