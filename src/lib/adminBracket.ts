"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateBracket } from "./bracketEngine";
import { groupArchersByDivision } from "./categoryGrouper";
import { assignSeedsFromQualification } from "./resultsSync";
import type { Archer } from "./types";

export async function adminForceBracketGeneration(
  supabase: SupabaseClient,
  tournamentId: string,
  allArchers: Archer[]
): Promise<void> {
  const grouped = groupArchersByDivision(allArchers);
  for (const division of Object.keys(grouped)) {
    await supabase
      .from("matches")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("division", division);

    await assignSeedsFromQualification(
      supabase,
      tournamentId,
      division,
      allArchers
    );

    const { data: fresh } = await supabase
      .from("archers")
      .select("*")
      .eq("tournament_id", tournamentId);
    const groupedFresh = groupArchersByDivision((fresh as Archer[]) ?? []);
    const divArchers = groupedFresh[division] ?? [];
    const rows = generateBracket(divArchers, tournamentId, division);
    if (rows.length) {
      await supabase.from("matches").insert(rows);
    }
  }

  await supabase
    .from("tournaments")
    .update({ status: "ELIMINATION" })
    .eq("id", tournamentId);
}
