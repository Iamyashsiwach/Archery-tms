export type TournamentStatus =
  | "REGISTRATION"
  | "QUALIFICATION"
  | "ELIMINATION"
  | "FINALS"
  | "COMPLETE";

export type EventType =
  | "WA18"
  | "WA25"
  | "WA720"
  | "R360"
  | "NFAA_FIELD"
  | "CUSTOM";

export type AgeCategory = "U18" | "U21" | "SENIOR" | "MASTER" | "VETERAN";
export type Gender = "M" | "F" | "X";
/** India-focused equipment classes: Olympic recurve, compound, and Indian bow. */
export type BowType = "RECURVE" | "COMPOUND" | "INDIAN";

export type ScoreRound = "QUALIFICATION" | "ELIMINATION" | "FINAL";

export type MatchStatus = "PENDING" | "ACTIVE" | "COMPLETE";

export type Medal = "GOLD" | "SILVER" | "BRONZE";

export interface Tournament {
  id: string;
  name: string;
  date: string;
  status: TournamentStatus;
  event_type: EventType;
  arrows_per_end: number;
  end_count: number;
  max_arrow_score: number;
  distance_meters: number | null;
  judge_access_code?: string | null;
  archers_per_bale?: number | null;
  bale_count?: number | null;
  created_at: string;
}

export interface Coach {
  id: string;
  tournament_id: string;
  display_name: string;
  club: string | null;
  invite_token: string;
  locked_at: string | null;
  created_at: string;
}

export interface Archer {
  id: string;
  tournament_id: string;
  name: string;
  club: string | null;
  age_category: AgeCategory | null;
  gender: Gender | null;
  bow_type: BowType | null;
  division: string | null;
  seed_rank: number | null;
  bale_number?: number | null;
  slot_index?: number | null;
  coach_id?: string | null;
  registration_locked?: boolean | null;
  deleted_at?: string | null;
  status: string;
  created_at: string;
}

export type ArrowValue = number | "X" | "M";

export interface ScoreRow {
  id: string;
  archer_id: string;
  tournament_id: string;
  round: ScoreRound;
  end_number: number;
  arrows: ArrowValue[];
  end_total: number;
  x_count: number;
  created_at: string;
}

export interface MatchRow {
  id: string;
  tournament_id: string;
  round: string | null;
  match_number: number | null;
  division: string | null;
  archer1_id: string | null;
  archer2_id: string | null;
  winner_id: string | null;
  set_points_1: number | null;
  set_points_2: number | null;
  status: MatchStatus;
  created_at?: string;
}

export interface ResultRow {
  id: string;
  archer_id: string;
  tournament_id: string;
  division: string | null;
  final_rank: number | null;
  total_score: number;
  total_x_count: number;
  medal: Medal | null;
  created_at?: string;
}

export interface LeaderboardEntry {
  archer_id: string;
  name: string;
  club: string | null;
  division: string | null;
  total_score: number;
  total_x_count: number;
  status: string;
  ends_complete: number;
  ends_required: number;
  bale_number?: number | null;
  slot_index?: number | null;
}
