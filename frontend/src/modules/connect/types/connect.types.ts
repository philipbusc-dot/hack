// ─── Swipe ────────────────────────────────────────────────────────────────────

export type SwipeStatus = "like" | "love" | "no";

export interface SwipeRequest {
  receiverId: string;
  status: SwipeStatus;
}

export interface SwipeResponse {
  id: string;
  senderId: string;
  receiverId: string;
  status: SwipeStatus;
  createdAt: string;
}

// ─── Location ─────────────────────────────────────────────────────────────────

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
}

// ─── Supply Info ──────────────────────────────────────────────────────────────

/** A single supply line item shown on a survivor's profile card */
export interface SupplyItem {
  /** Display label, e.g. "Medkit" */
  label: string;
  /** Numeric quantity */
  value: number;
  /** Unit string, e.g. "units" or "days" */
  unit: string;
}

export type DangerLevel = "LOW" | "MODERATE" | "HIGH";

/** A survival statistic from the RiskFactor module: name + value + unit. */
export interface SurvivalStatistic {
  name: string;
  value: number;
  unit: string;
}

// ─── Survivor Profile ─────────────────────────────────────────────────────────

/** Survivor profile as returned by GET /connect/survivors (nearby feed) */
export interface SurvivorProfile {
  id: string;
  name: string;
  distance: string;
  bio: string;
  age: number;
  baseLocation: string;
  /** AI-generated terminal-style assessment — fetched lazily per view, not in the feed. */
  aiOpinion?: string;
  avatarUrl: string;
  /** 10–99 compatibility score (only present on the nearby-feed response) */
  compatibilityScore?: number;
  /** Set when this profile came from GET /connect/matches */
  matchType?: "like" | "love" | null;
  // ─── RiskFactor module integration ───
  /** 0–100 personal risk factor (PSI), computed from this survivor's statistics. */
  personalRiskScore?: number;
  /** Danger band derived from the personal risk score. */
  personalDangerLevel?: DangerLevel;
  /** The weakest-link statistic driving the personal risk score. */
  limitingStat?: string | null;
  /** The survivor's RiskFactor statistics: name + value + unit. */
  statistics?: SurvivalStatistic[];
  /** @deprecated kept for backward compatibility; prefer personalRiskScore. */
  regionalRiskScore?: string | number;
  /** Structured supply inventory list */
  supplies?: SupplyItem[];
}

/** Matched survivor — matchType is always present */
export interface MatchedSurvivor extends SurvivorProfile {
  matchType: "like" | "love";
}
