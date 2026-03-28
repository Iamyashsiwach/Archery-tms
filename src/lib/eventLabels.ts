import type { EventType } from "./types";

/**
 * Indian-English labels for round formats (codes stay WA-compatible where noted).
 */
export const EVENT_FORMAT_LABELS: Record<EventType, string> = {
  WA18:
    "18 m — short distance (indoor / hall style; WA scoring zones)",
  WA25: "25 m — WA format, 3 arrows per end",
  WA720:
    "720 round — ranking (e.g. 70 m recurve / 50 m compound; national / WA circuit in India)",
  R360:
    "360 round — 12 ends × 3 arrows, cumulative total (max 360 on WA 10 ring). Use Custom if your association uses different ends.",
  NFAA_FIELD: "Field / marked round — outdoor targets, non-720 format",
  CUSTOM: "Custom — you set arrows per end, ends, and max score",
};

/** Short line for tooltips / help. */
export const EVENT_FORMAT_HINT =
  "Formats follow common Indian championship practice. 360 = twelve ends of three arrows at the standard target face.";
