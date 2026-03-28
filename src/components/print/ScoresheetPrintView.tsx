"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { PrintControls } from "@/components/print/PrintControls";
import { calculateTotal } from "@/lib/rulesEngine";
import type { Archer, ScoreRow, Tournament } from "@/lib/types";

export function ScoresheetPrintView({
  tournamentId,
  archerId,
}: {
  tournamentId: string;
  archerId: string;
}) {
  const supabase = useSupabase();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [archer, setArcher] = useState<Archer | null>(null);
  const [scores, setScores] = useState<ScoreRow[]>([]);

  useEffect(() => {
    if (!supabase) return;
    void (async () => {
      const [{ data: t }, { data: a }, { data: s }] = await Promise.all([
        supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
        supabase.from("archers").select("*").eq("id", archerId).single(),
        supabase
          .from("scores")
          .select("*")
          .eq("tournament_id", tournamentId)
          .eq("archer_id", archerId)
          .eq("round", "QUALIFICATION")
          .order("end_number"),
      ]);
      setTournament(t as Tournament);
      setArcher(a as Archer);
      setScores((s as ScoreRow[]) ?? []);
    })();
  }, [supabase, tournamentId, archerId]);

  const totals = useMemo(() => calculateTotal(scores), [scores]);
  const arrowsPer =
    tournament?.arrows_per_end ?? 3;

  if (!supabase) {
    return <p className="p-6">Configure Supabase.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-black print:bg-white print:text-black">
      <PrintControls />
      <header className="border-b border-neutral-300 pb-4">
        <h1 className="font-heading text-2xl font-bold">Score sheet</h1>
        {tournament && (
          <dl className="mt-2 font-mono text-sm">
            <dt className="inline text-neutral-500">Event: </dt>
            <dd className="inline">{tournament.name}</dd>
          </dl>
        )}
        {archer && (
          <dl className="mt-1 font-mono text-sm">
            <dt className="inline text-neutral-500">Archer: </dt>
            <dd className="inline font-semibold">{archer.name}</dd>
            <span className="ml-4 text-neutral-600">{archer.division}</span>
          </dl>
        )}
      </header>

      <table className="mt-6 w-full border-collapse border border-neutral-400 text-sm print:text-xs">
        <thead>
          <tr className="bg-neutral-100">
            <th className="border border-neutral-400 p-2 text-left">End</th>
            {Array.from({ length: arrowsPer }, (_, i) => (
              <th
                key={i}
                className="border border-neutral-400 p-2 font-mono"
              >
                A{i + 1}
              </th>
            ))}
            <th className="border border-neutral-400 p-2 font-mono">End Σ</th>
            <th className="border border-neutral-400 p-2 font-mono">Run Σ</th>
            <th className="border border-neutral-400 p-2 font-mono">X</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((row, idx) => {
            const run = calculateTotal(scores.slice(0, idx + 1));
            const cells = row.arrows.map((v, j) => (
              <td key={j} className="border border-neutral-400 p-2 text-center font-mono">
                {String(v)}
              </td>
            ));
            while (cells.length < arrowsPer) {
              cells.push(
                <td
                  key={`p-${cells.length}`}
                  className="border border-neutral-400 p-2"
                />
              );
            }
            return (
              <tr key={row.id}>
                <td className="border border-neutral-400 p-2 font-mono">
                  {row.end_number}
                </td>
                {cells}
                <td className="border border-neutral-400 p-2 text-center font-mono">
                  {row.end_total}
                </td>
                <td className="border border-neutral-400 p-2 text-center font-mono">
                  {run.total}
                </td>
                <td className="border border-neutral-400 p-2 text-center font-mono">
                  {run.xCount}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100 font-mono font-bold">
            <td
              className="border border-neutral-400 p-2"
              colSpan={arrowsPer + 1}
            >
              Total
            </td>
            <td className="border border-neutral-400 p-2 text-center">
              {totals.total}
            </td>
            <td className="border border-neutral-400 p-2 text-center">—</td>
            <td className="border border-neutral-400 p-2 text-center">
              {totals.xCount}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
