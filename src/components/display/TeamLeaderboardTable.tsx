"use client";

import type { TeamLeaderboardEntry } from "@/lib/types";

type Props = {
  division: string;
  rows: TeamLeaderboardEntry[];
};

export function TeamLeaderboardTable({ division, rows }: Props) {
  const filtered =
    division === ""
      ? rows
      : rows.filter((r) => (r.division ?? "") === division);

  const sorted = [...filtered].sort((a, b) => {
    if (b.total_score !== a.total_score)
      return b.total_score - a.total_score;
    if (b.total_x_count !== a.total_x_count)
      return b.total_x_count - a.total_x_count;
    return a.name.localeCompare(b.name);
  });

  const ranked: (TeamLeaderboardEntry & { rank: number })[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const rk =
      i > 0 &&
      prev.total_score === sorted[i].total_score &&
      prev.total_x_count === sorted[i].total_x_count
        ? ranked[i - 1].rank
        : i + 1;
    ranked.push({ ...sorted[i], rank: rk });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[480px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border text-secondary">
            <th className="px-3 py-3 font-heading text-xs uppercase">#</th>
            <th className="px-3 py-3 font-heading text-xs uppercase">Team</th>
            <th className="px-3 py-3 font-heading text-xs uppercase">
              Division
            </th>
            <th className="px-3 py-3 font-mono text-xs uppercase">Score</th>
            <th className="px-3 py-3 font-mono text-xs uppercase">X</th>
            <th className="px-3 py-3 font-mono text-xs uppercase">Ends</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r) => (
            <tr key={r.team_id} className="border-b border-border/70">
              <td className="px-3 py-2 font-mono text-secondary">
                <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-[#1a1a1a] px-2 py-0.5 text-primary">
                  {r.rank}
                </span>
              </td>
              <td className="px-3 py-2 font-heading text-primary">{r.name}</td>
              <td className="px-3 py-2 text-secondary">{r.division ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-lg text-primary">
                {r.total_score}
              </td>
              <td className="px-3 py-2 font-mono text-accent">
                {r.total_x_count}
              </td>
              <td className="px-3 py-2 font-mono text-secondary">
                {r.ends_complete}/{r.ends_required}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
