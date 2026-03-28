"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DivisionTabs } from "@/components/DivisionTabs";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { useArchers } from "@/hooks/useArchers";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useTournament } from "@/hooks/useTournament";
import { groupArchersByDivision } from "@/lib/categoryGrouper";
import { useSupabase } from "@/components/SupabaseProvider";

export function ResultsView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { tournament } = useTournament(supabase, tournamentId);
  const { archers } = useArchers(supabase, tournamentId);
  const { entries, loading } = useLeaderboard(supabase, tournament, archers);
  const divisions = useMemo(() => {
    const g = groupArchersByDivision(archers);
    return Object.keys(g).sort();
  }, [archers]);
  const [active, setActive] = useState("");

  useEffect(() => {
    if (divisions.length && (!active || !divisions.includes(active))) {
      setActive(divisions[0]);
    }
  }, [divisions, active]);

  const filtered = entries.filter((e) => e.division === active);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/display/${tournamentId}`} className="text-sm text-accent">
        ← Leaderboard
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold">Results</h1>
      {tournament && <p className="text-secondary">{tournament.name}</p>}
      {divisions.length > 0 && (
        <div className="mt-6">
          <DivisionTabs divisions={divisions} active={active} onChange={setActive} />
        </div>
      )}
      {loading ? (
        <p className="mt-8">Loading…</p>
      ) : (
        <div className="mt-6 space-y-4">
          <LeaderboardTable division={active} rows={filtered} topN={999} />
          <Link
            className="inline-block rounded-lg border border-border px-4 py-2 text-sm hover:border-accent"
            href={`/print/${tournamentId}/results/${encodeURIComponent(active)}`}
          >
            Printable results
          </Link>
        </div>
      )}
    </div>
  );
}
