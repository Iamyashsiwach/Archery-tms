import type { ArrowValue, ResultRow, ScoreRow } from "./types";
import type { Tournament } from "./types";

export interface EventConfig {
  arrowsPerEnd: number;
  endCount: number;
  maxArrowScore: number;
  scoringZones: ArrowValue[];
  useSetSystem: boolean;
}

function waZones(max: number): ArrowValue[] {
  const nums: ArrowValue[] = [];
  for (let v = max; v >= 1; v--) nums.push(v);
  return ["X", ...nums, "M"];
}

const NFAA_ZONES: ArrowValue[] = [5, 4, 3, 2, 1, "M"];

export function getEventConfig(
  eventType: string,
  tournament?: Pick<
    Tournament,
    "arrows_per_end" | "end_count" | "max_arrow_score"
  >
): EventConfig {
  switch (eventType) {
    case "WA18":
      return {
        arrowsPerEnd: 3,
        endCount: 20,
        maxArrowScore: 10,
        scoringZones: waZones(10),
        useSetSystem: true,
      };
    case "WA25":
      return {
        arrowsPerEnd: 3,
        endCount: 20,
        maxArrowScore: 10,
        scoringZones: waZones(10),
        useSetSystem: true,
      };
    case "WA720":
      return {
        arrowsPerEnd: 6,
        endCount: 24,
        maxArrowScore: 10,
        scoringZones: waZones(10),
        useSetSystem: false,
      };
    /** 360 round: perfect total 360 = 12 ends × 3 arrows × 10, WA 10-ring, cumulative. */
    case "R360":
      return {
        arrowsPerEnd: 3,
        endCount: 12,
        maxArrowScore: 10,
        scoringZones: waZones(10),
        useSetSystem: false,
      };
    case "NFAA_FIELD":
      return {
        arrowsPerEnd: 4,
        endCount: 28,
        maxArrowScore: 5,
        scoringZones: NFAA_ZONES,
        useSetSystem: false,
      };
    case "CUSTOM":
      if (!tournament) {
        throw new Error("CUSTOM event requires tournament row values");
      }
      return {
        arrowsPerEnd: tournament.arrows_per_end,
        endCount: tournament.end_count,
        maxArrowScore: tournament.max_arrow_score,
        scoringZones:
          tournament.max_arrow_score <= 5
            ? NFAA_ZONES
            : waZones(tournament.max_arrow_score),
        useSetSystem: false,
      };
    default:
      return getEventConfig("WA18");
  }
}

function arrowNumericValue(
  arrow: ArrowValue,
  config: EventConfig
): { points: number; x: number } {
  if (arrow === "M") return { points: 0, x: 0 };
  if (arrow === "X") {
    const xVal = config.maxArrowScore >= 10 ? 10 : config.maxArrowScore;
    return { points: xVal, x: 1 };
  }
  if (typeof arrow === "number") {
    if (arrow < 0 || arrow > config.maxArrowScore) {
      return { points: NaN, x: 0 };
    }
    return { points: arrow, x: 0 };
  }
  return { points: NaN, x: 0 };
}

export function validateEnd(
  arrows: ArrowValue[],
  config: EventConfig
): { valid: boolean; total: number; xCount: number; errors: string[] } {
  const errors: string[] = [];
  if (arrows.length !== config.arrowsPerEnd) {
    errors.push(
      `Expected ${config.arrowsPerEnd} arrows, got ${arrows.length}`
    );
  }
  let total = 0;
  let xCount = 0;
  for (let i = 0; i < arrows.length; i++) {
    const a = arrows[i];
    const { points, x } = arrowNumericValue(a, config);
    if (Number.isNaN(points)) {
      errors.push(`Invalid arrow value at position ${i + 1}: ${String(a)}`);
      continue;
    }
    if (!config.scoringZones.includes(a)) {
      errors.push(`Disallowed zone at arrow ${i + 1}: ${String(a)}`);
    }
    total += points;
    xCount += x;
  }
  return { valid: errors.length === 0, total, xCount, errors };
}

export function calculateTotal(scores: ScoreRow[]): {
  total: number;
  xCount: number;
  endBreakdown: number[];
} {
  let total = 0;
  let xCount = 0;
  const endBreakdown: number[] = [];
  for (const s of scores) {
    total += s.end_total;
    xCount += s.x_count;
    endBreakdown.push(s.end_total);
  }
  return { total, xCount, endBreakdown };
}

export function isTied(a: ResultRow, b: ResultRow): boolean {
  return a.total_score === b.total_score && a.total_x_count === b.total_x_count;
}
