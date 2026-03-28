"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateBracket } from "./bracketEngine";
import { groupArchersByDivision } from "./categoryGrouper";
import { calculateTotal } from "./rulesEngine";
import type { Archer, ScoreRow } from "./types";

export async function recalculateArcherResult(
  supabase: SupabaseClient,
  archerId: string,
  tournamentId: string,
  division: string | null
): Promise<void> {
  const { data: rows } = await supabase
    .from("scores")
    .select("*")
    .eq("archer_id", archerId)
    .eq("tournament_id", tournamentId)
    .eq("round", "QUALIFICATION")
    .order("end_number", { ascending: true });

  const scores = (rows ?? []) as ScoreRow[];
  const { total, xCount } = calculateTotal(scores);

  await supabase.from("results").upsert(
    {
      archer_id: archerId,
      tournament_id: tournamentId,
      division: division ?? null,
      total_score: total,
      total_x_count: xCount,
    },
    { onConflict: "archer_id,tournament_id" }
  );
}

export async function isDivisionQualificationComplete(
  supabase: SupabaseClient,
  tournamentId: string,
  division: string,
  endCount: number,
  archers: Archer[]
): Promise<boolean> {
  const active = archers.filter((a) => !a.deleted_at);
  const grouped = groupArchersByDivision(active);
  const list = grouped[division] ?? [];
  if (list.length === 0) return false;

  for (const a of list) {
    const { count } = await supabase
      .from("scores")
      .select("*", { count: "exact", head: true })
      .eq("archer_id", a.id)
      .eq("tournament_id", tournamentId)
      .eq("round", "QUALIFICATION");

    if ((count ?? 0) < endCount) return false;
  }
  return true;
}

export async function assignSeedsFromQualification(
  supabase: SupabaseClient,
  tournamentId: string,
  division: string,
  archers: Archer[]
): Promise<void> {
  const grouped = groupArchersByDivision(archers);
  const list = [...(grouped[division] ?? [])];
  const rows = await Promise.all(
    list.map(async (a) => {
      const { data } = await supabase
        .from("results")
        .select("total_score,total_x_count")
        .eq("archer_id", a.id)
        .eq("tournament_id", tournamentId)
        .maybeSingle();
      return {
        archer: a,
        total: data?.total_score ?? 0,
        x: data?.total_x_count ?? 0,
      };
    })
  );
  rows.sort((p, q) => {
    if (q.total !== p.total) return q.total - p.total;
    if (q.x !== p.x) return q.x - p.x;
    return p.archer.name.localeCompare(q.archer.name);
  });
  let rank = 1;
  for (const r of rows) {
    await supabase
      .from("archers")
      .update({ seed_rank: rank++ })
      .eq("id", r.archer.id);
  }
}

/** When one division finishes all qualification ends: seed, insert bracket if needed, bump tournament phase. */
export async function maybeGenerateBracketForDivision(
  supabase: SupabaseClient,
  tournamentId: string,
  division: string,
  endCount: number,
  allArchers: Archer[]
): Promise<void> {
  const active = allArchers.filter((a) => !a.deleted_at);
  const complete = await isDivisionQualificationComplete(
    supabase,
    tournamentId,
    division,
    endCount,
    active
  );
  if (!complete) return;

  const { count: existing } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)
    .eq("division", division);

  if ((existing ?? 0) > 0) return;

  await assignSeedsFromQualification(supabase, tournamentId, division, active);

  const { data: freshArchers } = await supabase
    .from("archers")
    .select("*")
    .eq("tournament_id", tournamentId)
    .is("deleted_at", null);
  const withSeeds = (freshArchers ?? []) as Archer[];
  const groupedFresh = groupArchersByDivision(withSeeds);
  const divArchers = groupedFresh[division] ?? [];

  const rows = generateBracket(divArchers, tournamentId, division);
  if (rows.length) {
    await supabase.from("matches").insert(rows);
  }

  await supabase
    .from("tournaments")
    .update({ status: "ELIMINATION" })
    .eq("id", tournamentId);
}

export async function bumpRegistrationToQualificationIfNeeded(
  supabase: SupabaseClient,
  tournamentId: string
): Promise<void> {
  const { data: t } = await supabase
    .from("tournaments")
    .select("status")
    .eq("id", tournamentId)
    .single();
  if (t?.status === "REGISTRATION") {
    await supabase
      .from("tournaments")
      .update({ status: "QUALIFICATION" })
      .eq("id", tournamentId);
  }
}
