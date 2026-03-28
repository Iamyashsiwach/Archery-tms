"use client";

import {
  bracketStageHeading,
  bracketStageHint,
} from "@/lib/archeryTerms";
import type { Archer, MatchRow } from "@/lib/types";

type Props = {
  matches: MatchRow[];
  archersById: Map<string, Archer>;
};

function nameFor(
  id: string | null | undefined,
  archersById: Map<string, Archer>
) {
  if (!id) return "Bye / waiting";
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
    <div className="min-w-[200px] rounded-lg border border-border bg-[#141414] p-3 shadow-lg">
      <p className="mb-1 text-center font-mono text-[10px] uppercase text-secondary">
        Match #{m.match_number ?? "—"}
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
      {m.status === "COMPLETE" && m.winner_id && (
        <p className="mt-2 text-center text-[10px] font-mono uppercase tracking-wide text-accent">
          Winner: {nameFor(m.winner_id, archersById)}
        </p>
      )}
      {m.status !== "COMPLETE" && m.archer1_id && m.archer2_id && (
        <p className="mt-2 text-center text-[10px] text-secondary">Awaiting result</p>
      )}
    </div>
  );
}

function StageColumn({
  round,
  matches: ms,
  archersById,
}: {
  round: "QF" | "SF" | "BRONZE" | "FINAL";
  matches: MatchRow[];
  archersById: Map<string, Archer>;
}) {
  return (
    <div className="flex max-w-[220px] flex-col gap-3">
      <div className="text-center">
        <h3 className="font-heading text-xs uppercase tracking-widest text-accent">
          {bracketStageHeading(round)}
        </h3>
        <p className="mt-1 text-[11px] leading-snug text-secondary">
          {bracketStageHint(round)}
        </p>
      </div>
      <div className="flex flex-col justify-center gap-5">
        {ms.length === 0 && (
          <p className="rounded-lg border border-dashed border-border/60 py-6 text-center text-xs text-secondary">
            No matches yet — finish qualification or generate elimination matches in Admin.
          </p>
        )}
        {ms.map((m) => (
          <MatchCard key={m.id} m={m} archersById={archersById} />
        ))}
      </div>
    </div>
  );
}

export function BracketTree({ matches, archersById }: Props) {
  const qf = matches.filter((m) => m.round === "QF");
  const sf = matches.filter((m) => m.round === "SF");
  const bronze = matches.filter((m) => m.round === "BRONZE");
  const fin = matches.filter((m) => m.round === "FINAL");

  return (
    <div>
      <p className="mb-6 text-center text-sm text-secondary">
        Read left to right: early rounds on the left, gold and bronze on the right.
        Amber highlight = won that match.
      </p>
      <div className="flex flex-wrap justify-center gap-6 md:flex-nowrap md:justify-between md:gap-4">
        <StageColumn round="QF" matches={qf} archersById={archersById} />
        <div className="hidden md:block self-stretch w-px bg-border/60" aria-hidden />
        <StageColumn round="SF" matches={sf} archersById={archersById} />
        <div className="hidden md:block self-stretch w-px bg-border/60" aria-hidden />
        <div className="flex max-w-[220px] flex-col gap-6">
          <StageColumn
            round="BRONZE"
            matches={bronze}
            archersById={archersById}
          />
          <StageColumn round="FINAL" matches={fin} archersById={archersById} />
        </div>
      </div>
    </div>
  );
}
