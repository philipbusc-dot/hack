// Feature 4 — AI Survival Briefing System (frontend contracts).

export type BriefingMode = "chat" | "actions" | "evacuation";
export type ThreatLevel = "LOW" | "MODERATE" | "HIGH";
export type BriefingSource = "openai" | "fallback";
export type ActionPriority = "NOW" | "SOON" | "MONITOR";

/** Request body for POST /ai/generate-briefing (all optional but mode). */
export interface BriefingRequest {
  mode: BriefingMode;
  message?: string;
  location?: string;
  regionalRisk?: number;
  hospitalStrain?: number;
  humidity?: number;
  airportActivity?: number;
  nearbySurvivors?: number;
  compatibilityScore?: number;
}

interface BriefingMeta {
  source: BriefingSource;
  generatedAt: string;
}

export interface ChatBriefing extends BriefingMeta {
  mode: "chat";
  reply: string;
}

export interface ActionItem {
  title: string;
  priority: ActionPriority;
  rationale: string;
}

export interface ActionsBriefing extends BriefingMeta {
  mode: "actions";
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

export interface EvacuationBriefing extends BriefingMeta {
  mode: "evacuation";
  region: string;
  direction: string;
  safeZone: SafeZone;
  routeSteps: RouteStep[];
  departureWindow: DepartureWindow;
}

export type Briefing = ChatBriefing | ActionsBriefing | EvacuationBriefing;

/** A chat message rendered in the thread. */
export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  /** May contain a small whitelisted set of inline tags (see chat parser). */
  html: string;
  pending?: boolean;
}

// ── KnowledgeArticle CRUD ──────────────────────────────────────────────────

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeInput {
  title: string;
  content: string;
  category: string;
  source: string;
}

export type UpdateKnowledgeInput = Partial<CreateKnowledgeInput>;
