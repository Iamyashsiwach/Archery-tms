import type { AgeCategory, Archer, BowType, Gender } from "./types";

const BOW_LABEL: Record<BowType, string> = {
  RECURVE: "Recurve",
  COMPOUND: "Compound",
  BAREBOW: "Barebow",
  LONGBOW: "Longbow",
};

const GENDER_LABEL: Record<Gender, string> = {
  M: "Men",
  F: "Women",
  X: "Open",
};

const AGE_LABEL: Record<AgeCategory, string> = {
  U18: "U18",
  U21: "U21",
  SENIOR: "Senior",
  MASTER: "Master",
  VETERAN: "Veteran",
};

export function getDivision(
  bowType: BowType | null | undefined,
  gender: Gender | null | undefined,
  ageCategory: AgeCategory | null | undefined
): string {
  const bow = bowType ? BOW_LABEL[bowType] : "Unknown Bow";
  const gen = gender ? GENDER_LABEL[gender] : "Open";
  const age = ageCategory ? AGE_LABEL[ageCategory] : "Open";
  return `${bow} ${gen} ${age}`;
}

export function groupArchersByDivision(
  archers: Archer[]
): Record<string, Archer[]> {
  const map: Record<string, Archer[]> = {};
  for (const a of archers) {
    const div =
      a.division?.trim() ||
      getDivision(a.bow_type, a.gender, a.age_category);
    if (!map[div]) map[div] = [];
    map[div].push(a);
  }
  return map;
}
