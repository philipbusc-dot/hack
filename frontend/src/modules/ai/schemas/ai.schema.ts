import type { CreateKnowledgeInput } from "../types/ai.types";

/**
 * Lightweight client validation for the KnowledgeArticle form, mirroring the
 * backend Zod rules. Returns fieldName → error message (empty = valid).
 */
export function validateKnowledge(
  input: CreateKnowledgeInput
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.title.trim().length === 0) errors["title"] = "Title is required";
  if (input.content.trim().length === 0)
    errors["content"] = "Content is required";
  if (input.category.trim().length === 0)
    errors["category"] = "Category is required";
  if (input.source.trim().length === 0) errors["source"] = "Source is required";
  return errors;
}

/** True when the draft passes client validation. */
export function isKnowledgeValid(input: CreateKnowledgeInput): boolean {
  return Object.keys(validateKnowledge(input)).length === 0;
}
