"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import type { Archer } from "@/lib/types";
import { getDivision } from "@/lib/categoryGrouper";

export type UseArchersOptions = {
  /** Include soft-deleted archers (admin/judge trash). Default false. */
  includeDeleted?: boolean;
  /** Only archers belonging to this coach (coach portal). */
  coachId?: string | null;
};

export function useArchers(
  supabase: SupabaseClient | null,
  tournamentId: string | undefined,
  opts?: UseArchersOptions
) {
  const includeDeleted = opts?.includeDeleted ?? false;
  const coachId = opts?.coachId;

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
    let q = supabase
      .from("archers")
      .select("*")
      .eq("tournament_id", tournamentId);
    if (!includeDeleted) {
      q = q.is("deleted_at", null);
    }
    if (coachId) {
      q = q.eq("coach_id", coachId);
    }
    const { data, error: e } = await q.order("name");
    if (e) setError(e.message);
    else setError(null);
    setArchers((data as Archer[]) ?? []);
    setLoading(false);
  }, [supabase, tournamentId, includeDeleted, coachId]);

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
    coach_id?: string | null;
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
        coach_id: payload.coach_id ?? null,
        registration_locked: false,
      })
      .select()
      .single();
    if (insErr) throw insErr;
    await fetchArchers();
    return data as Archer;
  }

  return { archers, loading, error, refetch: fetchArchers, registerArcher };
}
