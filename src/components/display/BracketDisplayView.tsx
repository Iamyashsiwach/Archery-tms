"use client";

import { useEffect, useMemo, useState } from "react";
import { BracketTree } from "@/components/BracketTree";
import { DivisionTabs } from "@/components/DivisionTabs";
import { useArchers } from "@/hooks/useArchers";
import { useBracket } from "@/hooks/useBracket";
import { groupArchersByDivision } from "@/lib/categoryGrouper";
import { useSupabase } from "@/components/SupabaseProvider";

export function BracketDisplayView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { archers } = useArchers(supabase, tournamentId);
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

  const { matches } = useBracket(supabase, tournamentId, active || undefined);

  const archersById = useMemo(
    () => new Map(archers.map((a) => [a.id, a] as const)),
    [archers]
  );

  const divMatches = active
    ? matches.filter((m) => m.division === active)
    : matches;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">Bracket</h1>
      {divisions.length > 0 && (
        <div className="mt-4">
          <DivisionTabs divisions={divisions} active={active} onChange={setActive} />
        </div>
      )}
      <div className="mt-8 overflow-x-auto">
        <BracketTree matches={divMatches} archersById={archersById} />
      </div>
    </div>
  );
}
