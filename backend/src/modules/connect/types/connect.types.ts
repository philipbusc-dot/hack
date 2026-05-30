// ─── Prisma Model Shapes ─────────────────────────────────────────────────────
// These mirror the Prisma-generated model types without depending on @ts-nocheck files.

/**
 * The DB shape the model layer returns: a User row (after the User↔Survivor
 * merge) together with its survival statistics. The controller maps this to the
 * frontend-facing `SurvivorView`.
 */
export interface UserWithStats {
  id: string;
  username: string;
  description: string | null;
  age: number | null;
  baseLocation: string | null;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  createdAt: Date;
  stats: { id: string; name: string; value: number; unit: string }[];
}

/**
 * A survivor profile as the frontend consumes it. Field names are preserved
 * from the pre-merge `Survivor` shape (name/bio/avatarUrl/latitude/…) so the
 * Connect frontend needs no changes; the controller maps a `User` into this.
 */
export interface SurvivorView {
  id: string;
  name: string;
  age: number;
  bio: string;
  baseLocation: string;
  latitude: number;
  longitude: number;
  avatarUrl: string;
  createdAt: Date;
  supplies: SupplyItem[];
}

export interface Match {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  createdAt: Date;
}

// ─── Supply Info ─────────────────────────────────────────────────────────────

/** A single supply line item sent to the frontend */
export interface SupplyItem {
  label: string;
  value: number;
  unit: string;
}

// ─── Risk Factor (shared with the riskScore/personalRisk module) ──────────────

export type DangerLevel = "LOW" | "MODERATE" | "HIGH";

/**
 * A survival statistic as modeled by the RiskFactor module: a named resource
 * with a numeric value and a unit (e.g. "Water Stock" / 30 / "days").
 */
export interface SurvivalStatistic {
  name: string;
  value: number;
  unit: string;
}

/**
 * A survivor's personal risk factor, computed with the RiskFactor module's
 * formula library (lib/formulas) from their survival statistics.
 */
export interface PersonalRisk {
  /** 0–100 personal danger score (PSI). */
  personalRiskScore: number;
  personalDangerLevel: DangerLevel;
  /** The weakest-link statistic that drives the score, if any. */
  limitingStat: string | null;
  /** The survivor's statistics: name + value + unit. */
  statistics: SurvivalStatistic[];
}

// ─── Survivor / Nearby Survivors ─────────────────────────────────────────────

/** Full survivor profile enriched with computed fields for the nearby-feed */
export interface SurvivorProfileResponse extends SurvivorView, PersonalRisk {
  /** Human-readable Haversine distance, e.g. "3.2 km" or "850 m" */
  distance: string;
  /** 10–99 compatibility score */
  compatibilityScore: number;
  /** Structured supply inventory list */
  supplies: SupplyItem[];
}

/** Response for GET /connect/survivors/:id/opinion (lazy, cached AI opinion). */
export interface OpinionResponse {
  aiOpinion: string;
}

// ─── Matches ──────────────────────────────────────────────────────────────────

/** Matched survivor profile enriched with distance and the swipe type */
export interface MatchedSurvivorResponse extends SurvivorView, PersonalRisk {
  distance: string;
  matchType: "like" | "love";
  /** Structured supply inventory list */
  supplies: SupplyItem[];
}

/** Current-user profile enriched with their own personal risk factor. */
export interface CurrentUserResponse extends SurvivorView, PersonalRisk {
  supplies: SupplyItem[];
}

// ─── Swipe ────────────────────────────────────────────────────────────────────

/** Response shape for POST /connect/swipe */
export interface SwipeResponse {
  id: string;
  senderId: string;
  receiverId: string;
  status: "like" | "love" | "no";
  createdAt: Date;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/** Single message as returned to the frontend — sender resolved to "you" | "them" */
export interface MessageResponse {
  id: string;
  sender: "you" | "them";
  text: string;
  timestamp: string;
}

/** Response shape for PATCH /connect/messages/:messageId */
export interface EditMessageResponse extends ChatMessage {}

/** Response shape for DELETE /connect/messages/:messageId */
export interface DeleteMessageResponse {
  success: boolean;
  message: string;
}
