// Browser-side persistence for chatbot conversations (localStorage).
// Stateless backend + this = real, revisitable chat history with no server work.
import type { ChatMessage } from "../types/ai.types";

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

const KEY = "safehaivn.chats.v1";

/** Load saved conversations, dropping any corrupt or mid-flight (pending) data. */
export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (c): c is Conversation =>
          !!c && typeof c.id === "string" && Array.isArray(c.messages)
      )
      .map((c) => ({
        id: c.id,
        title: typeof c.title === "string" ? c.title : "Chat",
        updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : 0,
        // Never restore unfinished "pending" bubbles or empty messages.
        messages: c.messages.filter(
          (m) => m && !m.pending && typeof m.html === "string" && m.html.length > 0
        ),
      }))
      .filter((c) => c.messages.length > 0);
  } catch {
    return [];
  }
}

/** Persist conversations. Silently ignores quota / disabled-storage errors. */
export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(conversations));
  } catch {
    /* storage full or unavailable — history just won't persist this session */
  }
}

/** Derive a short, readable title from the first user message. */
export function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user")?.html.trim();
  if (!firstUser) return "New chat";
  return firstUser.length > 32 ? `${firstUser.slice(0, 32)}…` : firstUser;
}
