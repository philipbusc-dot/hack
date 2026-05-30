// Feature 4 — AI Survival Briefing System. Briefing request/response contracts.

export type BriefingMode = "chat" | "actions" | "evacuation";
export type ThreatLevel = "LOW" | "MODERATE" | "HIGH";
export type BriefingSource = "openai" | "fallback";
export type ActionPriority = "NOW" | "SOON" | "MONITOR";

/** One prior turn of the conversation, sent so the chatbot has short memory. */
export interface ChatTurn {
  role: "user" | "ai";
  content: string;
}

/** Inputs accepted by POST /ai/generate-briefing (all optional). */
export interface BriefingInput {
  mode: BriefingMode;
  message?: string;
  /** Recent conversation history (chat mode) — gives the bot continuity. */
  history?: ChatTurn[];
  location?: string;
  regionalRisk?: number;
  hospitalStrain?: number;
  humidity?: number;
  airportActivity?: number;
  nearbySurvivors?: number;
  compatibilityScore?: number;
}

/** Resolved context (body values merged over DB-derived defaults). */
export interface BriefingContext {
  location: string;
  threatLevel: ThreatLevel;
  regionalRisk: number;
  hospitalStrain: number;
  humidity: number;
  airportActivity: number;
  nearbySurvivors: number;
  compatibilityScore: number;
}

export interface ChatPayload {
  reply: string;
  /** Knowledge-base article titles that informed the reply (RAG-lite). */
  sources?: string[];
}

export interface ActionItem {
  title: string;
  priority: ActionPriority;
  rationale: string;
}

export interface ActionsPayload {
  region: string;
  threatLevel: ThreatLevel;
  actions: ActionItem[];
}

export interface SafeZone {
  name: string;
  meta: string;
  verifiedClean: boolean;
}

export interface RouteStep {
  action: string;
  detail: string;
}

export interface DepartureWindow {
  label: string;
  timeRemaining: string;
  progressPct: number;
}

export interface EvacuationPayload {
  region: string;
  direction: string;
  safeZone: SafeZone;
  routeSteps: RouteStep[];
  departureWindow: DepartureWindow;
}

interface BriefingMeta {
  source: BriefingSource;
  generatedAt: string;
}

export type ChatBriefing = { mode: "chat" } & BriefingMeta & ChatPayload;
export type ActionsBriefing = { mode: "actions" } & BriefingMeta &
  ActionsPayload;
export type EvacuationBriefing = { mode: "evacuation" } & BriefingMeta &
  EvacuationPayload;

export type Briefing = ChatBriefing | ActionsBriefing | EvacuationBriefing;
