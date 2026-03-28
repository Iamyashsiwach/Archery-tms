"use client";

import type { Archer } from "@/lib/types";
import { groupAssignmentsByBale, slotLetter } from "@/lib/targetAllotment";

function TargetFace({ baleNumber }: { baleNumber: number }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[140px]">
      <div className="absolute inset-0 rounded-full border-2 border-[#2a2a2a] bg-[#f5f5f0] shadow-[inset_0_0_12px_rgba(0,0,0,0.15)]" />
      <div className="absolute inset-[8%] rounded-full border border-[#1a1a1a] bg-[#111]" />
      <div className="absolute inset-[18%] rounded-full bg-[#2d6cdf]" />
      <div className="absolute inset-[32%] rounded-full bg-[#c62828]" />
      <div className="absolute inset-[46%] rounded-full bg-[#e8a020]" />
      <div className="absolute inset-[58%] rounded-full border border-[#333] bg-[#f5f5f0]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-heading text-lg font-bold text-white drop-shadow-md sm:text-xl">
          {baleNumber}
        </span>
      </div>
    </div>
  );
}

type Props = {
  archers: Archer[];
  archersPerBale: number;
  /** Show all bale numbers from 1..totalBales (padded empty targets) */
  totalBales?: number | null;
  title?: string;
  /** Larger type for field / TV */
  emphasize?: boolean;
};

export function TargetBaleBoard({
  archers,
  archersPerBale,
  totalBales,
  title = "Target allotment",
  emphasize = false,
}: Props) {
  const grouped = groupAssignmentsByBale(archers);
  const assignedMax =
    grouped.size > 0 ? Math.max(...grouped.keys()) : 0;
  const cap =
    totalBales != null && totalBales > 0
      ? Math.max(totalBales, assignedMax)
      : Math.max(assignedMax, 1);

  const slots = Math.max(1, archersPerBale);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2
          className={`font-heading font-bold text-primary ${emphasize ? "text-3xl sm:text-4xl" : "text-2xl"}`}
        >
          {title}
        </h2>
        <p className="mt-2 font-mono text-sm text-secondary">
          Find your <span className="text-accent">bale number</span> and{" "}
          <span className="text-accent">position (A–D)</span>. Shoot only on
          your assigned target.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: cap }, (_, i) => i + 1).map((baleNum) => {
          const rows = grouped.get(baleNum) ?? [];
          const bySlot = new Map<number, Archer>();
          for (const r of rows) {
            bySlot.set(r.slot_index, r.archer);
          }
          return (
            <article
              key={baleNum}
              className="rounded-2xl border-2 border-border bg-surface p-4 shadow-lg"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-xs uppercase tracking-widest text-accent">
                    Bale
                  </p>
                  <p
                    className={`font-mono font-bold text-primary ${emphasize ? "text-4xl" : "text-3xl"}`}
                  >
                    {baleNum}
                  </p>
                </div>
                <TargetFace baleNumber={baleNum} />
              </div>
              <ul className="mt-4 space-y-2 border-t border-border pt-3">
                {Array.from({ length: slots }, (_, s) => s + 1).map((slot) => {
                  const archer = bySlot.get(slot);
                  const letter = slotLetter(slot);
                  return (
                    <li
                      key={slot}
                      className={`flex gap-3 rounded-lg px-2 py-2 ${archer ? "bg-[#1a1a1a]" : "opacity-50"}`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono font-bold text-black ${archer ? "bg-accent" : "bg-border text-secondary"}`}
                      >
                        {letter}
                      </span>
                      <div className="min-w-0 flex-1">
                        {archer ? (
                          <>
                            <p
                              className={`truncate font-heading text-primary ${emphasize ? "text-lg" : "text-base"}`}
                            >
                              {archer.name}
                            </p>
                            <p className="truncate text-xs text-secondary">
                              {archer.division}
                              {archer.club ? ` · ${archer.club}` : ""}
                            </p>
                          </>
                        ) : (
                          <p className="pt-2 text-sm text-secondary">
                            Open slot
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
