import api from "../../../api";
import type {
  ActionsBriefing,
  Briefing,
  BriefingRequest,
  ChatBriefing,
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

/** Convenience: chat mode. */
export async function generateChat(
  message: string
): Promise<ChatBriefing> {
  const { data } = await api.post<ChatBriefing>("/ai/generate-briefing", {
    mode: "chat",
    message,
  });
  return data;
}

/** Convenience: actions mode. */
export async function generateActions(): Promise<ActionsBriefing> {
  const { data } = await api.post<ActionsBriefing>("/ai/generate-briefing", {
    mode: "actions",
  });
  return data;
}

/** Convenience: evacuation mode. */
export async function generateEvacuation(): Promise<EvacuationBriefing> {
  const { data } = await api.post<EvacuationBriefing>("/ai/generate-briefing", {
    mode: "evacuation",
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
