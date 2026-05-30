import type { Message, SendMessageRequest } from "../types/ChatPage.types";

// ─── Send Message Validation ──────────────────────────────────────────────────

/**
 * Validates a send-message payload before it is sent to the API.
 * Throws a descriptive error if validation fails.
 */
export function validateSendMessage(payload: unknown): SendMessageRequest {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Message payload must be an object.");
  }
  const p = payload as Record<string, unknown>;

  if (typeof p.text !== "string" || p.text.trim() === "") {
    throw new Error("Message text must be a non-empty string.");
  }

  return { text: p.text.trim() };
}

// ─── Message Shape Guard ──────────────────────────────────────────────────────

const VALID_SENDERS = ["you", "them"] as const;

/**
 * Validates that an API response object has the correct shape of a Message.
 * Useful for runtime data integrity checks on incoming chat data.
 */
export function isMessage(value: unknown): value is Message {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === "string" &&
    VALID_SENDERS.includes(v.sender as (typeof VALID_SENDERS)[number]) &&
    typeof v.text === "string" &&
    typeof v.timestamp === "string"
  );
}

/**
 * Validates that an array of unknown values are all valid Messages.
 */
export function isMessageArray(value: unknown): value is Message[] {
  return Array.isArray(value) && value.every(isMessage);
}
