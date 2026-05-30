import api from "../../../api";
import type {
  ActionsBriefing,
  Briefing,
  BriefingRequest,
  ChatBriefing,
  ChatTurn,
  CreateKnowledgeInput,
  EvacuationBriefing,
  KnowledgeArticle,
  UpdateKnowledgeInput,
} from "../types/ai.types";

/** POST /ai/generate-briefing — generic. */
export async function generateBriefing(
  body: BriefingRequest
): Promise<Briefing> {
  const { data } = await api.post<Briefing>("/ai/generate-briefing", body);
  return data;
}

/** Convenience: chat mode. Pass recent turns so the bot has continuity. */
export async function generateChat(
  message: string,
  history: ChatTurn[] = []
): Promise<ChatBriefing> {
  const { data } = await api.post<ChatBriefing>("/ai/generate-briefing", {
    mode: "chat",
    message,
    history,
  });
  return data;
}

/** Convenience: actions mode. Optionally tailored to the chat conversation. */
export async function generateActions(
  history: ChatTurn[] = []
): Promise<ActionsBriefing> {
  const { data } = await api.post<ActionsBriefing>("/ai/generate-briefing", {
    mode: "actions",
    history,
  });
  return data;
}

/** Live context fed into the evacuation plan (sourced from the Connect tab). */
export interface EvacuationContext {
  /** Where the survivor currently is (their Connect base location). */
  location?: string;
  /** How many nearby survivors Connect found. */
  nearbySurvivors?: number;
  /** Best nearby-survivor compatibility score (0–100). */
  compatibilityScore?: number;
  /** Regional risk score (0–100), if available. */
  regionalRisk?: number;
}

/**
 * Convenience: evacuation mode. Optionally grounded in the survivor's live
 * Connect data (GPS location + nearby survivors). With no context it falls
 * back to the scenario defaults server-side.
 */
export async function generateEvacuation(
  context: EvacuationContext = {}
): Promise<EvacuationBriefing> {
  const { data } = await api.post<EvacuationBriefing>("/ai/generate-briefing", {
    mode: "evacuation",
    ...context,
  });
  return data;
}

// ── KnowledgeArticle CRUD ──────────────────────────────────────────────────

/** GET /knowledge — optional ?category= filter. */
export async function fetchKnowledge(
  category?: string
): Promise<KnowledgeArticle[]> {
  const { data } = await api.get<KnowledgeArticle[]>("/knowledge", {
    params: category ? { category } : undefined,
  });
  return data;
}

/** POST /knowledge */
export async function createKnowledge(
  input: CreateKnowledgeInput
): Promise<KnowledgeArticle> {
  const { data } = await api.post<KnowledgeArticle>("/knowledge", input);
  return data;
}

/** PUT /knowledge/:id */
export async function updateKnowledge(
  id: string,
  input: UpdateKnowledgeInput
): Promise<KnowledgeArticle> {
  const { data } = await api.put<KnowledgeArticle>(`/knowledge/${id}`, input);
  return data;
}

/** DELETE /knowledge/:id */
export async function deleteKnowledge(id: string): Promise<void> {
  await api.delete(`/knowledge/${id}`);
}
