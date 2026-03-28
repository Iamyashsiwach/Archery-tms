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

export type BracketAdvancePatch = {
  targetMatchId: string;
  archer1_id?: string | null;
  archer2_id?: string | null;
};

function loserOf(m: MatchRow): string | null {
  if (m.status !== "COMPLETE" || !m.winner_id) return null;
  if (m.winner_id === m.archer1_id) return m.archer2_id ?? null;
  return m.archer1_id ?? null;
}

/**
 * After a match is marked COMPLETE, returns DB updates that place winners (and SF losers into bronze).
 * QF → SF slots; SF → gold final + when both semis are done, bronze gets both losers.
 */
export function advanceBracket(
  completedMatch: MatchRow,
  allMatches: MatchRow[]
): BracketAdvancePatch[] {
  const { round, match_number, winner_id, division: div } = completedMatch;
  if (!winner_id || completedMatch.status !== "COMPLETE") return [];

  const sameDiv = allMatches.filter((m) => m.division === div);
  const sf = sameDiv
    .filter((m) => m.round === "SF")
    .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0));
  const out: BracketAdvancePatch[] = [];

  if (round === "QF" && sf.length >= 2) {
    const idx = (match_number ?? 1) - 1;
    const sfIdx = idx < 2 ? 0 : 1;
    const target = sf[sfIdx];
    if (!target) return [];
    if (idx % 2 === 0) {
      out.push({ targetMatchId: target.id, archer1_id: winner_id });
    } else {
      out.push({ targetMatchId: target.id, archer2_id: winner_id });
    }
    return out;
  }

  if (round === "SF") {
    const finals = sameDiv
      .filter((m) => m.round === "FINAL")
      .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0))[0];
    const bronze = sameDiv
      .filter((m) => m.round === "BRONZE")
      .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0))[0];
    const sfSorted = [...sf].sort(
      (a, b) => (a.match_number ?? 0) - (b.match_number ?? 0)
    );
    const sfIndex = sfSorted.findIndex((m) => m.id === completedMatch.id);

    if (finals && sfIndex === 0) {
      out.push({ targetMatchId: finals.id, archer1_id: winner_id });
    }
    if (finals && sfIndex === 1) {
      out.push({ targetMatchId: finals.id, archer2_id: winner_id });
    }

    const allSfDone =
      sfSorted.length >= 2 && sfSorted.every((m) => m.status === "COMPLETE");
    if (bronze && allSfDone) {
      const l1 = loserOf(sfSorted[0]);
      const l2 = loserOf(sfSorted[1]);
      if (l1 && l2) {
        out.push({
          targetMatchId: bronze.id,
          archer1_id: l1,
          archer2_id: l2,
        });
      }
    }
    return out;
  }

  return [];
}
