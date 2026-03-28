"use client";

import { useEffect, useMemo, useState } from "react";
import { BracketTree } from "@/components/BracketTree";
import { PrintControls } from "@/components/print/PrintControls";
import { useSupabase } from "@/components/SupabaseProvider";
import type { Archer, MatchRow, Tournament } from "@/lib/types";

export function BracketPrintView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [archers, setArchers] = useState<Archer[]>([]);

  useEffect(() => {
    if (!supabase) return;
    void (async () => {
      const [{ data: t }, { data: m }, { data: a }] = await Promise.all([
        supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
        supabase
          .from("matches")
          .select("*")
          .eq("tournament_id", tournamentId)
          .order("match_number"),
        supabase.from("archers").select("*").eq("tournament_id", tournamentId),
      ]);
      setTournament(t as Tournament);
      setMatches((m as MatchRow[]) ?? []);
      setArchers((a as Archer[]) ?? []);
    })();
  }, [supabase, tournamentId]);

  const archersById = useMemo(
    () => new Map(archers.map((x) => [x.id, x] as const)),
    [archers]
  );

  if (!supabase) return <p className="p-6">Configure Supabase.</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-black print:bg-white">
      <PrintControls />
      <h1 className="font-heading text-2xl font-bold">Bracket</h1>
      {tournament && (
        <p className="mt-2 font-mono text-sm">{tournament.name}</p>
      )}
      <div className="mt-8">
        <BracketTree matches={matches} archersById={archersById} />
      </div>
    </div>
  );
}
