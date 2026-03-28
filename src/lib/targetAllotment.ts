import type { Archer } from "./types";

export interface BaleAssignment {
  archerId: string;
  bale_number: number;
  slot_index: number;
}

/** Slot 1 → A, 2 → B, … */
export function slotLetter(slotIndex: number): string {
  if (slotIndex < 1 || slotIndex > 26) return String(slotIndex);
  return String.fromCharCode(64 + slotIndex);
}

/**
 * Assign archers to bales in stable order: division, then name.
 * Uses at least `requestedBales` bales, or more if the archer count requires it.
 */
export function assignArchersToBales(
  archers: Archer[],
  requestedBales: number,
  archersPerBale: number
): { assignments: BaleAssignment[]; effectiveBaleCount: number } {
  const per = Math.max(1, Math.floor(archersPerBale));
  const sorted = [...archers].sort((a, b) => {
    const d = (a.division ?? "").localeCompare(b.division ?? "");
    if (d !== 0) return d;
    return a.name.localeCompare(b.name);
  });

  const minBales = Math.max(1, Math.ceil(sorted.length / per));
  const effectiveBaleCount = Math.max(
    Math.max(1, Math.floor(requestedBales)),
    minBales
  );

  const assignments: BaleAssignment[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const bale = Math.floor(i / per) + 1;
    const slot_index = (i % per) + 1;
    assignments.push({
      archerId: sorted[i].id,
      bale_number: bale,
      slot_index,
    });
  }

  return { assignments, effectiveBaleCount };
}

export function groupAssignmentsByBale(
  archers: Archer[]
): Map<number, { slot_index: number; archer: Archer }[]> {
  const map = new Map<number, { slot_index: number; archer: Archer }[]>();
  for (const a of archers) {
    if (a.bale_number == null || a.slot_index == null) continue;
    const list = map.get(a.bale_number) ?? [];
    list.push({ slot_index: a.slot_index, archer: a });
    map.set(a.bale_number, list);
  }
  for (const [, list] of map) {
    list.sort((x, y) => x.slot_index - y.slot_index);
  }
  return new Map([...map.entries()].sort((x, y) => x[0] - y[0]));
}
