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

// ─── Survivor Profile ─────────────────────────────────────────────────────────

/** Survivor profile as returned by GET /connect/survivors (nearby feed) */
export interface SurvivorProfile {
  id: string;
  name: string;
  distance: string;
  bio: string;
  age: number;
  baseLocation: string;
  /** AI-generated terminal-style compatibility summary */
  aiOpinion: string;
  avatarUrl: string;
  /** 10–99 compatibility score (only present on the nearby-feed response) */
  compatibilityScore?: number;
  /** Set when this profile came from GET /connect/matches */
  matchType?: "like" | "love" | null;
  // RiskFactor and Setting properties
  regionalRiskScore?: string | number;
  /** Structured supply inventory list */
  supplies?: SupplyItem[];
}

/** Matched survivor — matchType is always present */
export interface MatchedSurvivor extends SurvivorProfile {
  matchType: "like" | "love";
}
