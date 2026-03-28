/** Indian vs US English labels used on field displays. */

export type TermsLocale = "IND" | "US" | "BOTH";

export function formatTermsLocale(
  locale: TermsLocale | null | undefined
): TermsLocale {
  return locale === "IND" || locale === "US" ? locale : "BOTH";
}

export function baleLabel(locale: TermsLocale | null | undefined): string {
  const l = formatTermsLocale(locale);
  if (l === "US") return "Target bale #";
  if (l === "IND") return "Target no.";
  return "Bale / target # (US: bale · India: target)";
}

export function slotLabel(locale: TermsLocale | null | undefined): string {
  const l = formatTermsLocale(locale);
  if (l === "US") return "Shooting position (A–D)";
  if (l === "IND") return "Position on line (A–D)";
  return "Position (A–D)";
}

export function endLabel(locale: TermsLocale | null | undefined): string {
  const l = formatTermsLocale(locale);
  if (l === "US") return "End";
  if (l === "IND") return "End / round";
  return "End (WA: 3 arrows per end)";
}

export function qualificationLabel(locale: TermsLocale | null | undefined): string {
  const l = formatTermsLocale(locale);
  if (l === "US") return "Qualification (ranking)";
  if (l === "IND") return "Qualification round";
  return "Qualification (ranking round)";
}

export function bracketRoundLabel(
  round: string | null | undefined,
  locale: TermsLocale | null | undefined
): { short: string; us: string; ind: string } {
  const l = formatTermsLocale(locale);
  const r = (round ?? "").toUpperCase();
  const map: Record<string, { short: string; us: string; ind: string }> = {
    QF: {
      short: "QF",
      us: "Quarterfinal",
      ind: "Quarter-final",
    },
    SF: {
      short: "SF",
      us: "Semifinal",
      ind: "Semi-final",
    },
    BRONZE: {
      short: "Bronze",
      us: "Bronze medal match",
      ind: "Bronze match",
    },
    FINAL: {
      short: "Gold",
      us: "Gold medal final",
      ind: "Final",
    },
  };
  const row = map[r] ?? {
    short: r || "Match",
    us: "Match",
    ind: "Match",
  };
  if (l === "US") return { short: row.short, us: row.us, ind: row.ind };
  if (l === "IND") return { short: row.short, us: row.us, ind: row.ind };
  return row;
}

export function matchLegendLines(locale: TermsLocale | null | undefined): string[] {
  const l = formatTermsLocale(locale);
  const base = [
    "QF = quarter-finals · SF = semi-finals · Bronze = 3rd place · Final = gold.",
  ];
  if (l === "BOTH") {
    return [
      ...base,
      "US: often “bale” for the physical target stand; India: “target assignment” sheet uses target number + position.",
    ];
  }
  return base;
}
