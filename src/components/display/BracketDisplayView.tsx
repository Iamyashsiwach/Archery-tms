"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BracketHowItWorks } from "@/components/bracket/BracketHowItWorks";
import { BracketTree } from "@/components/BracketTree";
import { DivisionTabs } from "@/components/DivisionTabs";
import { useArchers } from "@/hooks/useArchers";
import { useBracket } from "@/hooks/useBracket";
import { useTournament } from "@/hooks/useTournament";
import { groupArchersByDivision } from "@/lib/categoryGrouper";
import { useSupabase } from "@/components/SupabaseProvider";

export function BracketDisplayView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { tournament } = useTournament(supabase, tournamentId);
  const { archers } = useArchers(supabase, tournamentId);
  const [pop, setPop] = useState<string | null>(null);

  useEffect(() => {
    if (!pop) return;
    const t = window.setTimeout(() => setPop(null), 4500);
    return () => window.clearTimeout(t);
  }, [pop]);

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

  const { matches, loading } = useBracket(
    supabase,
    tournamentId,
    active || undefined,
    {
      onRemoteMatchUpdate: () =>
        setPop("Elimination matches updated — new results or pairings are on screen."),
    }
  );

  const archersById = useMemo(
    () => new Map(archers.map((a) => [a.id, a] as const)),
    [archers]
  );

  const divMatches = active
    ? matches.filter((m) => m.division === active)
    : matches;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href={`/display/${tournamentId}`}
        className="text-sm text-accent hover:underline print:hidden"
      >
        ← Leaderboard
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold text-primary">
        Elimination matches
      </h1>
      {tournament && (
        <p className="mt-1 text-secondary">{tournament.name}</p>
      )}

      <div className="mt-6 print:hidden">
        <BracketHowItWorks />
      </div>

      {divisions.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-xs text-secondary">
            Each tab is one category (division). Only archers in that category appear
            here.
          </p>
          <DivisionTabs divisions={divisions} active={active} onChange={setActive} />
        </div>
      )}

      {loading ? (
        <p className="mt-10 text-secondary">Loading elimination matches…</p>
      ) : (
        <div className="mt-10">
          <BracketTree matches={divMatches} archersById={archersById} />
        </div>
      )}

      {pop && (
        <div
          role="status"
          className="fixed left-1/2 top-20 z-[200] max-w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-accent/50 bg-surface px-4 py-3 text-center text-sm text-primary shadow-lg print:hidden"
        >
          {pop}
        </div>
      )}
    </div>
  );
}
