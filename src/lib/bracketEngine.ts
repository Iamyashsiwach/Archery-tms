import type { Archer, MatchRow } from "./types";

function nextPow2(n: number): number {
  let p = 4;
  while (p < n) p *= 2;
  return p;
}

/** Standard 8-slot bracket seed order (positions 0..7) for adjacent-pair first round. */
function seedOrder8(): number[] {
  return [0, 7, 3, 4, 2, 5, 1, 6].map((i) => i);
}

export function generateBracket(
  archers: Archer[],
  tournamentId: string,
  division: string
): Omit<MatchRow, "id" | "created_at">[] {
  const sorted = [...archers].sort((a, b) => {
    const sa = a.seed_rank ?? 999;
    const sb = b.seed_rank ?? 999;
    return sa - sb;
  });

  const n = sorted.length;
  if (n < 4) return [];

  const qualified = n > 8 ? sorted.slice(0, 8) : sorted;
  const m = qualified.length;

  if (m >= 8) {
    return buildEightBracket(qualified, tournamentId, division);
  }

  return buildSmallBracket(qualified, tournamentId, division);
}

function buildEightBracket(
  seeds: Archer[],
  tournamentId: string,
  division: string
): Omit<MatchRow, "id" | "created_at">[] {
  const order = seedOrder8();
  const slots: (Archer | null)[] = Array(8).fill(null);
  for (let i = 0; i < seeds.length; i++) {
    slots[order[i]] = seeds[i];
  }

  const out: Omit<MatchRow, "id" | "created_at">[] = [];
  let matchNo = 1;

  for (let i = 0; i < 8; i += 2) {
    const a1 = slots[i];
    const a2 = slots[i + 1];
    if (a1 && a2) {
      out.push({
        tournament_id: tournamentId,
        round: "QF",
        match_number: matchNo++,
        division,
        archer1_id: a1.id,
        archer2_id: a2.id,
        winner_id: null,
        set_points_1: 0,
        set_points_2: 0,
        status: "PENDING",
      });
    } else if (a1 && !a2) {
      out.push({
        tournament_id: tournamentId,
        round: "QF",
        match_number: matchNo++,
        division,
        archer1_id: a1.id,
        archer2_id: null,
        winner_id: a1.id,
        set_points_1: 0,
        set_points_2: 0,
        status: "COMPLETE",
      });
    } else if (!a1 && a2) {
      out.push({
        tournament_id: tournamentId,
        round: "QF",
        match_number: matchNo++,
        division,
        archer1_id: null,
        archer2_id: a2.id,
        winner_id: a2.id,
        set_points_1: 0,
        set_points_2: 0,
        status: "COMPLETE",
      });
    }
  }

  for (const r of ["SF", "BRONZE", "FINAL"] as const) {
    const count = r === "SF" ? 2 : 1;
    for (let k = 0; k < count; k++) {
      out.push({
        tournament_id: tournamentId,
        round: r,
        match_number: matchNo++,
        division,
        archer1_id: null,
        archer2_id: null,
        winner_id: null,
        set_points_1: 0,
        set_points_2: 0,
        status: "PENDING",
      });
    }
  }

  return out;
}

function buildSmallBracketMergingFourToEight(seeds: Archer[]): (Archer | null)[] {
  const size = nextPow2(Math.max(seeds.length, 4));
  const slots: (Archer | null)[] = Array(size).fill(null);
  const idxOrder =
    size === 8
      ? seedOrder8()
      : [...Array(size).keys()];
  for (let i = 0; i < seeds.length; i++) {
    slots[idxOrder[i]] = seeds[i];
  }
  return slots;
}

function buildSmallBracket(
  seeds: Archer[],
  tournamentId: string,
  division: string
): Omit<MatchRow, "id" | "created_at">[] {
  const slots = buildSmallBracketMergingFourToEight(seeds);
  const out: Omit<MatchRow, "id" | "created_at">[] = [];
  let matchNo = 1;

  const roundLabel = "QF";

  for (let i = 0; i < slots.length; i += 2) {
    const a1 = slots[i];
    const a2 = slots[i + 1];
    if (a1 && a2) {
      out.push({
        tournament_id: tournamentId,
        round: roundLabel,
        match_number: matchNo++,
        division,
        archer1_id: a1.id,
        archer2_id: a2.id,
        winner_id: null,
        set_points_1: 0,
        set_points_2: 0,
        status: "PENDING",
      });
    } else if (a1 && !a2) {
      out.push({
        tournament_id: tournamentId,
        round: roundLabel,
        match_number: matchNo++,
        division,
        archer1_id: a1.id,
        archer2_id: null,
        winner_id: a1.id,
        set_points_1: 0,
        set_points_2: 0,
        status: "COMPLETE",
      });
    } else if (!a1 && a2) {
      out.push({
        tournament_id: tournamentId,
        round: roundLabel,
        match_number: matchNo++,
        division,
        archer1_id: null,
        archer2_id: a2.id,
        winner_id: a2.id,
        set_points_1: 0,
        set_points_2: 0,
        status: "COMPLETE",
      });
    }
  }

  const needSF = seeds.length > 2;
  if (needSF) {
    for (let k = 0; k < 2; k++) {
      out.push({
        tournament_id: tournamentId,
        round: "SF",
        match_number: matchNo++,
        division,
        archer1_id: null,
        archer2_id: null,
        winner_id: null,
        set_points_1: 0,
        set_points_2: 0,
        status: "PENDING",
      });
    }
    out.push({
      tournament_id: tournamentId,
      round: "BRONZE",
      match_number: matchNo++,
      division,
      archer1_id: null,
      archer2_id: null,
      winner_id: null,
      set_points_1: 0,
      set_points_2: 0,
      status: "PENDING",
    });
    out.push({
      tournament_id: tournamentId,
      round: "FINAL",
      match_number: matchNo++,
      division,
      archer1_id: null,
      archer2_id: null,
      winner_id: null,
      set_points_1: 0,
      set_points_2: 0,
      status: "PENDING",
    });
  }

  return out;
}

/**
 * Maps a completed match to the next slot in a fixed bracket layout.
 * Returns a partial row for the *next* match to merge (use with caution in DB).
 */
export function advanceBracket(
  completedMatch: MatchRow,
  allMatches: MatchRow[]
): Partial<MatchRow> & { targetMatchId?: string } {
  const { round, match_number, winner_id, division: div } = completedMatch;
  if (!winner_id || completedMatch.status !== "COMPLETE") return {};

  const sameDiv = allMatches.filter((m) => m.division === div);
  const sf = sameDiv
    .filter((m) => m.round === "SF")
    .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0));

  if (round === "QF" && sf.length >= 2) {
    const idx = (match_number ?? 1) - 1;
    const sfIdx = idx < 2 ? 0 : 1;
    const slot = idx % 2 === 0 ? "archer1_id" : "archer2_id";
    const target = sf[sfIdx];
    if (!target) return {};
    return { targetMatchId: target.id, [slot]: winner_id };
  }

  if (round === "SF") {
    const finals = sameDiv
      .filter((m) => m.round === "FINAL")
      .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0))[0];
    const bronze = sameDiv
      .filter((m) => m.round === "BRONZE")
      .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0))[0];
    const loserId =
      completedMatch.winner_id === completedMatch.archer1_id
        ? completedMatch.archer2_id
        : completedMatch.archer1_id;
    const sfOrder = sf.map((m) => m.id);
    const sfIndex = sfOrder.indexOf(completedMatch.id);
    if (finals && sfIndex === 0) {
      return { targetMatchId: finals.id, archer1_id: winner_id };
    }
    if (finals && sfIndex === 1) {
      return { targetMatchId: finals.id, archer2_id: winner_id };
    }
    if (bronze && loserId) {
      const otherSf = sf.find((m) => m.id !== completedMatch.id);
      if (otherSf?.status === "COMPLETE" && bronze) {
        const b1 =
          otherSf.winner_id === otherSf.archer1_id
            ? otherSf.archer2_id
            : otherSf.archer1_id;
        return {
          targetMatchId: bronze.id,
          archer1_id: loserId,
          archer2_id: b1 ?? undefined,
        };
      }
    }
  }

  return {};
}
