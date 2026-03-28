"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useArchers } from "@/hooks/useArchers";
import { useBracket } from "@/hooks/useBracket";
import { useTournament } from "@/hooks/useTournament";
import { useSupabase } from "@/components/SupabaseProvider";
import type { MatchRow } from "@/lib/types";

export function MatchScoreView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { tournament } = useTournament(supabase, tournamentId);
  const { archers } = useArchers(supabase, tournamentId);
  const { matches, refetch } = useBracket(supabase, tournamentId);
  const [pick, setPick] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const archersById = useMemo(
    () => new Map(archers.map((a) => [a.id, a] as const)),
    [archers]
  );

  const pending = matches.filter((m) => m.status !== "COMPLETE" && m.archer1_id && m.archer2_id);

  const setWinner = async (m: MatchRow, winnerId: string) => {
    if (!supabase) return;
    setMsg(null);
    const { error } = await supabase
      .from("matches")
      .update({ winner_id: winnerId, status: "COMPLETE" })
      .eq("id", m.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    await refetch();
    setMsg("Match updated.");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link href={`/judge/${tournamentId}`} className="text-sm text-accent">
        ← Back
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-bold">Match scoring</h1>
      {tournament && (
        <p className="text-sm text-secondary">{tournament.name}</p>
      )}
      <ul className="mt-6 flex flex-col gap-4">
        {pending.map((m) => {
          const a1 = m.archer1_id ? archersById.get(m.archer1_id)?.name : "TBD";
          const a2 = m.archer2_id ? archersById.get(m.archer2_id)?.name : "TBD";
          const open = pick === m.id;
          return (
            <li
              key={m.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="font-mono text-xs text-secondary">
                {m.division} · {m.round} #{m.match_number}
              </p>
              <p className="mt-2 font-heading">{a1}</p>
              <p className="font-heading text-secondary">vs</p>
              <p className="font-heading">{a2}</p>
              {!open ? (
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg border border-accent py-2 text-accent"
                  onClick={() => setPick(m.id)}
                >
                  Set winner
                </button>
              ) : (
                <div className="mt-3 flex gap-2">
                  {m.archer1_id && (
                    <button
                      type="button"
                      className="flex-1 rounded-lg bg-accent py-2 text-black"
                      onClick={() => void setWinner(m, m.archer1_id!)}
                    >
                      {a1} wins
                    </button>
                  )}
                  {m.archer2_id && (
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-border py-2"
                      onClick={() => void setWinner(m, m.archer2_id!)}
                    >
                      {a2} wins
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {pending.length === 0 && (
        <p className="mt-8 text-secondary">
          No head-to-head matches ready (add bracket from qualification or Admin).
        </p>
      )}
      {msg && <p className="mt-4 text-sm text-secondary">{msg}</p>}
    </div>
  );
}
