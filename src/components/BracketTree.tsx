"use client";

import type { Archer, MatchRow } from "@/lib/types";

type Props = {
  matches: MatchRow[];
  archersById: Map<string, Archer>;
};

function nameFor(
  id: string | null | undefined,
  archersById: Map<string, Archer>
) {
  if (!id) return "TBD";
  return archersById.get(id)?.name ?? "Unknown";
}

function MatchCard({
  m,
  archersById,
}: {
  m: MatchRow;
  archersById: Map<string, Archer>;
}) {
  const w1 = m.winner_id === m.archer1_id;
  const w2 = m.winner_id === m.archer2_id;
  const l1 = m.status === "COMPLETE" && m.winner_id && !w1;
  const l2 = m.status === "COMPLETE" && m.winner_id && !w2;

  return (
    <div className="min-w-[180px] rounded-lg border border-border bg-[#141414] p-3 shadow-lg">
      <p className="mb-2 text-center font-mono text-[10px] uppercase text-secondary">
        {m.round ?? "Match"} #{m.match_number ?? "—"}
      </p>
      <div
        className={`rounded px-2 py-2 font-heading text-sm ${
          w1
            ? "bg-accent/25 text-primary ring-1 ring-amber-400/40"
            : l1
              ? "text-secondary line-through opacity-70"
              : "text-primary"
        }`}
      >
        {nameFor(m.archer1_id, archersById)}
      </div>
      <div className="my-1 h-px bg-border" />
      <div
        className={`rounded px-2 py-2 font-heading text-sm ${
          w2
            ? "bg-accent/25 text-primary ring-1 ring-amber-400/40"
            : l2
              ? "text-secondary line-through opacity-70"
              : "text-primary"
        }`}
      >
        {nameFor(m.archer2_id, archersById)}
      </div>
    </div>
  );
}

export function BracketTree({ matches, archersById }: Props) {
  const qf = matches.filter((m) => m.round === "QF");
  const sf = matches.filter((m) => m.round === "SF");
  const bronze = matches.filter((m) => m.round === "BRONZE");
  const fin = matches.filter((m) => m.round === "FINAL");

  const col = (title: string, ms: MatchRow[]) => (
    <div className="flex flex-col gap-6">
      <h3 className="text-center font-heading text-xs uppercase tracking-widest text-accent">
        {title}
      </h3>
      <div className="flex flex-col justify-center gap-6">
        {ms.length === 0 && (
          <p className="text-center text-sm text-secondary">—</p>
        )}
        {ms.map((m) => (
          <MatchCard key={m.id} m={m} archersById={archersById} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-wrap justify-center gap-4 md:flex-nowrap md:gap-8">
      {col("QF", qf)}
      {col("SF", sf)}
      <div className="flex flex-col gap-6">
        <h3 className="text-center font-heading text-xs uppercase tracking-widest text-accent">
          Bronze
        </h3>
        <div className="flex flex-col gap-6">
          {bronze.map((m) => (
            <MatchCard key={m.id} m={m} archersById={archersById} />
          ))}
        </div>
        <h3 className="text-center font-heading text-xs uppercase tracking-widest text-accent">
          Gold
        </h3>
        <div className="flex flex-col gap-6">
          {fin.map((m) => (
            <MatchCard key={m.id} m={m} archersById={archersById} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-center font-heading text-xs uppercase tracking-widest text-secondary">
          Results
        </h3>
        <p className="max-w-[140px] text-center text-xs text-secondary">
          Winners advance visually in the tree. Complete matches on the judge
          screen to populate finals.
        </p>
      </div>
    </div>
  );
}
