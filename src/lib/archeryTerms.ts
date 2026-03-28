/** Single set of field labels (no regional style switch). */

export function baleLabel(): string {
  return "Bale #";
}

export function slotLabel(): string {
  return "Position (A–D)";
}

export function endLabel(): string {
  return "End";
}

export function qualificationLabel(): string {
  return "Qualification";
}

export function bracketRoundTitle(round: string | null | undefined): string {
  const r = (round ?? "").toUpperCase();
  const map: Record<string, string> = {
    QF: "Quarter-final",
    SF: "Semi-final",
    BRONZE: "Bronze match",
    FINAL: "Gold final",
  };
  return map[r] ?? (r || "Match");
}

export function matchLegendLines(): string[] {
  return [
    "QF = quarter-finals · SF = semi-finals · Bronze = 3rd place · Final = gold.",
  ];
}

/** Short headings for bracket columns (tree layout). */
export function bracketStageHeading(
  round: "QF" | "SF" | "BRONZE" | "FINAL"
): string {
  const titles: Record<string, string> = {
    QF: "Quarter-finals",
    SF: "Semi-finals",
    BRONZE: "Bronze (3rd place)",
    FINAL: "Gold final (1st place)",
  };
  return titles[round] ?? round;
}

/** One-line hint under each stage for spectators. */
export function bracketStageHint(round: "QF" | "SF" | "BRONZE" | "FINAL"): string {
  const hints: Record<string, string> = {
    QF: "Four matches · winners continue on the right",
    SF: "Two matches · winners meet in the gold final",
    BRONZE: "Losers of the semis shoot for bronze",
    FINAL: "Winner takes gold; runner-up is silver",
  };
  return hints[round] ?? "";
}

/** Numbered steps for “how it works” panels. */
export function bracketHowItWorksIntro(): string {
  return "After qualification, the top archers enter single elimination matches. Each match has two archers; the judge records who won. Winners move toward the gold final on the right; beaten semi-finalists shoot the bronze match.";
}
