import OpenAI from "openai";

// Shared AI provider for the whole app (the AI chatbot and Connect's
// compatibility opinion). Points the OpenAI SDK at any OpenAI-compatible
// provider (Groq, DeepSeek, Ollama, …) via OPENAI_BASE_URL. Leaving
// OPENAI_API_KEY blank disables AI everywhere and callers fall back to templates.

/** True when an API key is configured. */
export function aiEnabled(): boolean {
  const key = process.env["OPENAI_API_KEY"];
  return !!(key && key.trim().length > 0);
}

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!aiEnabled()) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env["OPENAI_API_KEY"],
      baseURL: process.env["OPENAI_BASE_URL"] || undefined,
    });
  }
  return client;
}

/**
 * Single-shot text completion. Returns the model's text, or `null` on any
 * failure (no key, network, quota, empty output) so callers can fall back to a
 * deterministic template instead of breaking the request.
 */
export async function generateText(
  system: string,
  user: string,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const r = await c.chat.completions.create({
      model: process.env["OPENAI_MODEL"] || "gpt-4o-mini",
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return r.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn(
      `[ai] generateText failed, using fallback: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return null;
  }
}
