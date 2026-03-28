"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { PrintControls } from "@/components/print/PrintControls";
import { groupArchersByDivision } from "@/lib/categoryGrouper";
import type { Archer, Tournament } from "@/lib/types";

export function ResultsPrintView({
  tournamentId,
  division,
}: {
  tournamentId: string;
  division: string;
}) {
  const supabase = useSupabase();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [archers, setArchers] = useState<Archer[]>([]);
  const [scoresMap, setScoresMap] = useState<
    Map<string, { t: number; x: number }>
  >(new Map());

  useEffect(() => {
    if (!supabase) return;
    void (async () => {
      const [{ data: t }, { data: a }, { data: s }] = await Promise.all([
        supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
        supabase.from("archers").select("*").eq("tournament_id", tournamentId),
        supabase
          .from("scores")
          .select("*")
          .eq("tournament_id", tournamentId)
          .eq("round", "QUALIFICATION"),
      ]);
      setTournament(t as Tournament);
      const arch = (a as Archer[]) ?? [];
      setArchers(arch);
      const m = new Map<string, { t: number; x: number }>();
      for (const row of (s as {
        archer_id: string;
        end_total: number;
        x_count: number;
      }[]) ?? []) {
        const cur = m.get(row.archer_id) ?? { t: 0, x: 0 };
        cur.t += row.end_total;
        cur.x += row.x_count;
        m.set(row.archer_id, cur);
      }
      setScoresMap(m);
    })();
  }, [supabase, tournamentId]);

  const rows = useMemo(() => {
    const g = groupArchersByDivision(archers);
    const list = g[division] ?? [];
    return [...list]
      .map((a) => ({
        archer: a,
        ...(scoresMap.get(a.id) ?? { t: 0, x: 0 }),
      }))
      .sort((p, q) => {
        if (q.t !== p.t) return q.t - p.t;
        if (q.x !== p.x) return q.x - p.x;
        return p.archer.name.localeCompare(q.archer.name);
      });
  }, [archers, division, scoresMap]);

  const ranked: { archer: Archer; t: number; x: number; rk: number }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    let rk = i + 1;
    if (
      i > 0 &&
      rows[i - 1].t === r.t &&
      rows[i - 1].x === r.x
    ) {
      rk = ranked[i - 1].rk;
    }
    ranked.push({ ...r, rk });
  }

  if (!supabase) return <p className="p-6">Configure Supabase.</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-black print:bg-white">
      <PrintControls />
      <h1 className="font-heading text-2xl font-bold">Results — {division}</h1>
      {tournament && (
        <p className="mt-2 font-mono text-sm text-neutral-600">
          {tournament.name}
        </p>
      )}
      <table className="mt-6 w-full border-collapse border border-neutral-400 text-sm">
        <thead className="bg-neutral-100">
          <tr>
            <th className="border p-2 text-left">Rank</th>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">School / region</th>
            <th className="border p-2 font-mono">Score</th>
            <th className="border p-2 font-mono">X</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r) => (
            <tr key={r.archer.id}>
              <td className="border p-2 font-mono">{r.rk}</td>
              <td className="border p-2 font-heading">{r.archer.name}</td>
              <td className="border p-2">{r.archer.club ?? "—"}</td>
              <td className="border p-2 text-center font-mono">{r.t}</td>
              <td className="border p-2 text-center font-mono">{r.x}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
