"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BracketHowItWorks } from "@/components/bracket/BracketHowItWorks";
import { useArchers } from "@/hooks/useArchers";
import { useBracket } from "@/hooks/useBracket";
import { useTournament } from "@/hooks/useTournament";
import { useSupabase } from "@/components/SupabaseProvider";
import {
  advanceBracket,
  type BracketAdvancePatch,
} from "@/lib/bracketEngine";
import { bracketRoundTitle, matchLegendLines } from "@/lib/archeryTerms";
import type { MatchRow } from "@/lib/types";

async function applyBracketPatches(
  supabase: SupabaseClient,
  patches: BracketAdvancePatch[]
) {
  for (const p of patches) {
    const body: { archer1_id?: string | null; archer2_id?: string | null } = {};
    if (p.archer1_id !== undefined) body.archer1_id = p.archer1_id;
    if (p.archer2_id !== undefined) body.archer2_id = p.archer2_id;
    if (Object.keys(body).length === 0) continue;
    const { error } = await supabase
      .from("matches")
      .update(body)
      .eq("id", p.targetMatchId);
    if (error) throw new Error(error.message);
  }
}

export function MatchScoreView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { tournament } = useTournament(supabase, tournamentId);
  const { archers } = useArchers(supabase, tournamentId);
  const suppressRemotePopUntil = useRef(0);
  const { matches, refetch } = useBracket(supabase, tournamentId, undefined, {
    onRemoteMatchUpdate: () => {
      if (Date.now() < suppressRemotePopUntil.current) return;
      setMsg("Elimination matches changed elsewhere — list refreshed.");
    },
  });
  const [pick, setPick] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [msg]);

  const archersById = useMemo(
    () => new Map(archers.map((a) => [a.id, a] as const)),
    [archers]
  );

  const pending = matches.filter((m) => m.status !== "COMPLETE" && m.archer1_id && m.archer2_id);

  const setWinner = async (m: MatchRow, winnerId: string) => {
    if (!supabase) return;
    setMsg("Recording winner…");
    suppressRemotePopUntil.current = Date.now() + 4500;
    const { error } = await supabase
      .from("matches")
      .update({ winner_id: winnerId, status: "COMPLETE" })
      .eq("id", m.id);
    if (error) {
      setMsg(error.message);
      return;
    }

    const { data: rows } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("match_number", { ascending: true });
    const all = (rows as MatchRow[]) ?? [];
    const completed = all.find((x) => x.id === m.id);
    if (completed) {
      try {
        await applyBracketPatches(supabase, advanceBracket(completed, all));
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Could not update elimination matches");
        await refetch();
        return;
      }
    }

    await refetch();
    setPick(null);
    setMsg(null);
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
      <details className="mt-4 rounded-lg border border-border/80 bg-surface print:hidden">
        <summary className="cursor-pointer px-3 py-3 text-xs font-heading uppercase tracking-wide text-accent">
          How match scoring fits elimination matches
        </summary>
        <div className="border-t border-border/60 px-3 py-3 text-xs text-secondary">
          {matchLegendLines().map((line) => (
            <p key={line} className="leading-relaxed">
              {line}
            </p>
          ))}
          <p className="mt-3 text-secondary">
            Tap <strong className="text-primary">Set winner</strong> (you’ll see a
            prompt), then the archer who won. QF winners move into semi-finals
            automatically; SF winners go to gold, and semi losers to bronze when both
            semis are done. The public elimination matches view updates live
            (Display → Elimination matches).
          </p>
        </div>
      </details>

      <div className="mt-4 print:hidden">
        <BracketHowItWorks />
      </div>
      <ul className="mt-6 flex flex-col gap-4">
        {pending.map((m) => {
          const a1 = m.archer1_id ? archersById.get(m.archer1_id)?.name : "TBD";
          const a2 = m.archer2_id ? archersById.get(m.archer2_id)?.name : "TBD";
          const open = pick === m.id;
          const roundTitle = bracketRoundTitle(m.round);
          return (
            <li
              key={m.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="font-mono text-xs text-secondary">
                {m.division} · {roundTitle} · #{m.match_number}
              </p>
              <p className="mt-2 font-heading">{a1}</p>
              <p className="font-heading text-secondary">vs</p>
              <p className="font-heading">{a2}</p>
              {!open ? (
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg border border-accent py-2 text-accent"
                  onClick={() => {
                    setPick(m.id);
                    setMsg("Choose who won — tap a name below.");
                  }}
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
          No head-to-head matches ready (finish qualification or generate elimination
          matches in Admin).
        </p>
      )}
      {msg && (
        <div
          role="status"
          className="fixed left-1/2 top-20 z-[200] max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm text-primary shadow-lg"
        >
          {msg}
        </div>
      )}
    </div>
  );
}
