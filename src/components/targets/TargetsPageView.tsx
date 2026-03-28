"use client";

import Link from "next/link";
import { TargetBaleBoard } from "@/components/targets/TargetBaleBoard";
import { useArchers } from "@/hooks/useArchers";
import { useTournament } from "@/hooks/useTournament";
import { useSupabase } from "@/components/SupabaseProvider";

type Props = {
  tournamentId: string;
  backHref: string;
  backLabel: string;
  emphasize?: boolean;
};

export function TargetsPageView({
  tournamentId,
  backHref,
  backLabel,
  emphasize = false,
}: Props) {
  const supabase = useSupabase();
  const { tournament } = useTournament(supabase, tournamentId);
  const { archers, loading } = useArchers(supabase, tournamentId);

  const per = tournament?.archers_per_bale ?? 4;
  const totalBales = tournament?.bale_count ?? null;

  if (!supabase) {
    return <p className="p-6 text-danger">Configure Supabase.</p>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href={backHref} className="text-sm text-accent hover:underline">
        ← {backLabel}
      </Link>
      {tournament && (
        <p className="mt-2 font-heading text-lg text-secondary">
          {tournament.name}
        </p>
      )}
      {loading ? (
        <p className="mt-8 text-secondary">Loading archers…</p>
      ) : (
        <div className="mt-8">
          <TargetBaleBoard
            archers={archers}
            archersPerBale={per}
            totalBales={totalBales}
            emphasize={emphasize}
          />
        </div>
      )}
      <p className="mt-10 text-center text-xs text-secondary">
        Positions follow the line: A is usually left on the shooting line. Confirm
        with the field captain if your venue uses a different layout.
      </p>
    </div>
  );
}
