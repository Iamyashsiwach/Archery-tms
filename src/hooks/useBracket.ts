"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchRow } from "@/lib/types";

export type UseBracketOptions = {
  /** Called only when Supabase realtime reports a `matches` change (not initial load or manual refetch). */
  onRemoteMatchUpdate?: () => void;
};

export function useBracket(
  supabase: SupabaseClient | null,
  tournamentId: string | undefined,
  division?: string,
  options?: UseBracketOptions
) {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const remoteCb = useRef(options?.onRemoteMatchUpdate);
  remoteCb.current = options?.onRemoteMatchUpdate;

  const fetchMatches = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!supabase || !tournamentId) {
        setMatches([]);
        setLoading(false);
        return;
      }
      if (!opts?.silent) setLoading(true);
      let q = supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("match_number", { ascending: true });
      if (division) q = q.eq("division", division);
      const { data } = await q;
      setMatches((data as MatchRow[]) ?? []);
      setLoading(false);
    },
    [supabase, tournamentId, division]
  );

  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    if (!supabase || !tournamentId) return;
    let debounce: number | undefined;
    const channel = supabase
      .channel(`bracket-${tournamentId}-${division ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          window.clearTimeout(debounce);
          debounce = window.setTimeout(() => {
            void fetchMatches({ silent: true }).then(() => {
              remoteCb.current?.();
            });
          }, 250);
        }
      )
      .subscribe();
    return () => {
      window.clearTimeout(debounce);
      void supabase.removeChannel(channel);
    };
  }, [supabase, tournamentId, division, fetchMatches]);

  return {
    matches,
    loading,
    refetch: () => void fetchMatches({ silent: true }),
  };
}
