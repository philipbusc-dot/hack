// ─── Prisma Model Shapes ─────────────────────────────────────────────────────
// These mirror the Prisma-generated model types without depending on @ts-nocheck files.

export interface Survivor {
  id: string;
  name: string;
  age: number;
  bio: string;
  baseLocation: string;
  latitude: number;
  longitude: number;
  avatarUrl: string;
  isCurrentUser: boolean;
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

// ─── Survivor / Nearby Survivors ─────────────────────────────────────────────

/** Full survivor profile enriched with computed fields for the nearby-feed */
export interface SurvivorProfileResponse extends Survivor {
  /** Human-readable Haversine distance, e.g. "3.2 km" or "850 m" */
  distance: string;
  /** 10–99 compatibility score */
  compatibilityScore: number;
  /** Short AI-generated tactical opinion on the pairing */
  aiOpinion: string;
  /** Structured supply inventory list */
  supplies: SupplyItem[];
}

// ─── Matches ──────────────────────────────────────────────────────────────────

/** Matched survivor profile enriched with distance and the swipe type */
export interface MatchedSurvivorResponse extends Survivor {
  distance: string;
  matchType: "like" | "love";
  /** Structured supply inventory list */
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
