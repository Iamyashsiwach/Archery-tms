"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DivisionTabs } from "@/components/DivisionTabs";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { useArchers } from "@/hooks/useArchers";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useTournament } from "@/hooks/useTournament";
import { groupArchersByDivision } from "@/lib/categoryGrouper";
import { useSupabase } from "@/components/SupabaseProvider";

const navLink =
  "rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm font-heading uppercase tracking-wide text-accent transition hover:border-accent";

export function LeaderboardView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { tournament } = useTournament(supabase, tournamentId);
  const { archers } = useArchers(supabase, tournamentId);
  const { entries, loading } = useLeaderboard(supabase, tournament, archers);
  const divisions = useMemo(() => {
    const g = groupArchersByDivision(archers);
    return Object.keys(g).sort();
  }, [archers]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (divisions.length && !divisions.includes(active)) {
      setActive(divisions[0]);
    }
  }, [divisions, active]);

  const filtered = entries.filter((e) => e.division === active);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/display/${tournamentId}`
      : "";

  if (!supabase) {
    return <p className="p-6 text-danger">Configure Supabase.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="sticky top-[52px] z-30 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-md print:static print:border-0 print:bg-transparent">
        <p className="text-center text-xs text-secondary">
          Refreshes live and every 30s. Top 8 marked for qualification.
        </p>
        <nav className="mt-3 flex flex-wrap items-center justify-center gap-2 print:hidden">
          <Link className={navLink} href={`/display/${tournamentId}/targets`}>
            Targets
          </Link>
          <Link className={navLink} href={`/display/${tournamentId}/bracket`}>
            Elimination matches
          </Link>
          <Link className={navLink} href={`/display/${tournamentId}/results`}>
            Results
          </Link>
          <Link className={navLink} href={`/print/${tournamentId}/bracket`}>
            Print elimination matches
          </Link>
        </nav>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">
            Live leaderboard
          </h1>
          {tournament && (
            <p className="mt-1 text-secondary">{tournament.name}</p>
          )}
        </div>
        {url && (
          <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 print:hidden">
            <QRCodeSVG
              value={url}
              size={96}
              fgColor="#e8a020"
              bgColor="#141414"
            />
            <div className="max-w-[200px]">
              <p className="font-mono text-[10px] break-all text-secondary">
                {url}
              </p>
            </div>
          </div>
        )}
      </div>

      {divisions.length > 0 && (
        <div className="mt-6">
          <DivisionTabs divisions={divisions} active={active} onChange={setActive} />
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-secondary">Loading…</p>
      ) : (
        <div className="mt-6">
          <LeaderboardTable division={active} rows={filtered} />
        </div>
      )}
    </div>
  );
}
