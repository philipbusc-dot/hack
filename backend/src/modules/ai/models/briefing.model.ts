import OpenAI from "openai";
import { prisma } from "../../../db";
import { riskToDanger } from "../../../lib/formulas";
import type {
  ActionItem,
  ActionsPayload,
  Briefing,
  BriefingContext,
  BriefingInput,
  ChatPayload,
  EvacuationPayload,
  ThreatLevel,
} from "../types/ai.types";

/** Bangkok default locale (design canon). */
const BANGKOK = { name: "Bangkok" };

/** Guardrail-encoding system prompt for the OpenAI path. */
const SYSTEM =
  "You are SafeHAIVN, a calm, human survival companion helping someone live through a global pandemic outbreak. " +
  "Speak naturally and conversationally, like a knowledgeable friend on the radio — never like a status readout or a list of metrics. " +
  "Always respond to what the user actually says: if they greet you or make small talk, reply warmly and invite them to ask about the outbreak; " +
  "if they ask a question, answer that question directly. " +
  "Bring in the situation data only when it is relevant to their message, and weave it into prose rather than reciting every number. " +
  "You can explain danger levels and environmental risks, suggest safe actions and evacuation strategies, and assess survivor compatibility. " +
  "Never diagnose disease, prescribe medicine, or act as a doctor. " +
  "Keep replies to 2–4 short sentences unless more detail is clearly needed.";

/**
 * Resolve the briefing context. Body values win; anything missing falls back
 * to the Bangkok / HIGH-threat design canon. The AI module is self-contained:
 * live region/survivor data belongs to other features' tables, so it is only
 * used here when passed in the request (e.g. at integration time).
 */
export async function resolveContext(
  input: BriefingInput
): Promise<BriefingContext> {
  const regionalRisk = input.regionalRisk ?? 78;
  return {
    location: input.location ?? BANGKOK.name,
    threatLevel: riskToDanger(regionalRisk),
    regionalRisk,
    hospitalStrain: input.hospitalStrain ?? 88,
    humidity: input.humidity ?? 74,
    airportActivity: input.airportActivity ?? 92,
    nearbySurvivors: input.nearbySurvivors ?? 3,
    compatibilityScore: input.compatibilityScore ?? 91,
  };
}

// ── Templated (deterministic, offline) generators ──────────────────────────

function fallbackChat(input: BriefingInput, ctx: BriefingContext): ChatPayload {
  const msg = (input.message ?? "").toLowerCase();

  if (/pack|supply|supplies|bring|kit/.test(msg)) {
    return {
      reply:
        `Pack for ${ctx.location}'s ${ctx.threatLevel} threat: 3 days of water, sealed high-calorie food, ` +
        `an N95-grade respirator, a basic trauma kit, a power bank, and printed maps. Keep the load under 12 kg so you stay mobile. ` +
        `With hospital strain at ${Math.round(ctx.hospitalStrain)}%, assume no resupply for 72 hours.`,
    };
  }
  if (/spread|transmit|catch|airborne|contagious/.test(msg)) {
    return {
      reply:
        `In ${ctx.location} the outbreak is spreading fastest through dense, high-traffic corridors — airport activity is ${Math.round(ctx.airportActivity)}/100 ` +
        `and humidity near ${Math.round(ctx.humidity)}% is helping it linger in still air. Avoid crowds and poorly ventilated transit hubs, ` +
        `mask up indoors, and move during off-peak hours. This is general risk guidance, not a medical diagnosis.`,
    };
  }
  if (/safe zone|evac|leave|escape|where.*go|route/.test(msg)) {
    return {
      reply:
        `${ctx.location} is rated ${ctx.threatLevel} threat, so plan to move. Your nearest verified-clean corridor heads north-east toward higher ground ` +
        `with lower density. There are ${ctx.nearbySurvivors} verified-clean survivors within 4 km who can confirm the route — coordinate before you depart and travel light.`,
    };
  }
  // Default: "is it safe to stay where I am?"
  return {
    reply:
      `Staying put in ${ctx.location} is risky right now — it's rated ${ctx.threatLevel} threat with a regional risk score of ${Math.round(ctx.regionalRisk)}/100. ` +
      `Infection pressure is climbing and hospital strain sits at ${Math.round(ctx.hospitalStrain)}%, so local care may be unavailable. ` +
      `The upside: ${ctx.nearbySurvivors} verified-clean survivors are within 4 km. Shelter in place only if you're well-supplied; otherwise prepare to move north-east. ` +
      `SafeHAIVN summarizes and recommends — it does not diagnose.`,
  };
}

function fallbackActions(ctx: BriefingContext): ActionsPayload {
  const high = ctx.threatLevel === "HIGH";
  const strained = ctx.hospitalStrain >= 80;
  const humid = ctx.humidity >= 70;
  const busy = ctx.airportActivity >= 70;

  const actions: ActionItem[] = [
    {
      title: "Seal & stock your shelter",
      priority: high ? "NOW" : "SOON",
      rationale: `Secure 72h of water, food and meds before supply lines tighten at ${Math.round(ctx.regionalRisk)}/100 risk.`,
    },
    {
      title: "Fit a respirator before moving",
      priority: high ? "NOW" : "SOON",
      rationale: humid
        ? `Humidity near ${Math.round(ctx.humidity)}% keeps particles airborne longer in still spaces.`
        : "Filter inhaled air in any crowded or enclosed corridor.",
    },
    {
      title: "Avoid hospitals unless critical",
      priority: strained ? "NOW" : "MONITOR",
      rationale: `Hospital strain is ${Math.round(ctx.hospitalStrain)}% — facilities are overloaded and high-exposure.`,
    },
    {
      title: "Plot a north-east exit route",
      priority: high ? "SOON" : "MONITOR",
      rationale: "Pre-map a low-density corridor to higher ground so you can leave fast if conditions worsen.",
    },
    {
      title: "Link up with verified-clean survivors",
      priority: "SOON",
      rationale: `${ctx.nearbySurvivors} verified-clean contacts within 4 km can share routes, supplies and confirmed-safe waypoints.`,
    },
    {
      title: "Avoid airport & transit hubs",
      priority: busy ? "SOON" : "MONITOR",
      rationale: `Airport activity ${Math.round(ctx.airportActivity)}/100 makes transit nodes the highest-exposure zones.`,
    },
    {
      title: "Charge power & download offline maps",
      priority: "MONITOR",
      rationale: "Assume grid and network outages; keep navigation and comms working off-grid.",
    },
    {
      title: "Recheck the threat feed every 6h",
      priority: "MONITOR",
      rationale: "Risk scores move quickly; re-run your briefing to catch escalation early.",
    },
  ];

  return { region: ctx.location, threatLevel: ctx.threatLevel, actions };
}

function fallbackEvacuation(ctx: BriefingContext): EvacuationPayload {
  // Tighter departure window when the threat is higher.
  const minsRemaining =
    ctx.threatLevel === "HIGH" ? 160 : ctx.threatLevel === "MODERATE" ? 300 : 480;
  const hours = Math.floor(minsRemaining / 60);
  const mins = minsRemaining % 60;
  const totalWindow = 480; // 8h planning horizon
  const progressPct = Math.round(
    Math.min(100, Math.max(0, (1 - minsRemaining / totalWindow) * 100))
  );

  return {
    region: ctx.location,
    direction: "NORTH-EAST",
    safeZone: {
      name: "Nonthaburi Highland Relief Point",
      meta: `~18 km NE · lower density · regional risk ${Math.round(ctx.regionalRisk)} → falling`,
      verifiedClean: ctx.nearbySurvivors > 0,
    },
    routeSteps: [
      {
        action: "Head north on Vibhavadi corridor",
        detail: "Stay on elevated roadway; bypass the flooded riverside district.",
      },
      {
        action: "Cross at the eastern checkpoint",
        detail: `Verified-clean checkpoint — ${ctx.nearbySurvivors} survivors confirm it's open and screened.`,
      },
      {
        action: "Continue NE to the highland relief point",
        detail: "Lower population density and away from the airport exposure zone.",
      },
      {
        action: "Check in with the relief coordinator",
        detail: "Register, resupply water, and confirm onward shelter assignment.",
      },
    ],
    departureWindow: {
      label: "DEPART WITHIN",
      timeRemaining: `${hours}h ${mins.toString().padStart(2, "0")}m`,
      progressPct,
    },
  };
}

// ── Knowledge-base retrieval (RAG-lite) ─────────────────────────────────────

/** Common words ignored when keyword-matching the knowledge base. */
const STOPWORDS = new Set([
  "the", "and", "for", "are", "with", "you", "your", "what", "when", "where",
  "how", "this", "that", "there", "here", "from", "have", "has", "had", "will",
  "would", "should", "could", "about", "into", "onto", "they", "them", "then",
  "than", "but", "not", "can", "dont", "does", "did", "was", "were", "its",
  "should", "safe", "get", "need", "want", "any", "some", "out",
]);

/** A retrieved knowledge-base snippet injected into the prompt. */
interface KnowledgeHit {
  title: string;
  content: string;
}

/**
 * RAG-lite: find the knowledge-base articles most relevant to the user's
 * message by simple keyword overlap. The KB is tiny, so we score in memory.
 * Returns [] (and never throws) when the message is empty or the DB is down.
 */
async function retrieveKnowledge(
  message: string | undefined,
  limit = 3
): Promise<KnowledgeHit[]> {
  const tokens = [
    ...new Set((message ?? "").toLowerCase().match(/[a-z]{3,}/g) ?? []),
  ].filter((t) => !STOPWORDS.has(t));
  if (tokens.length === 0) return [];

  let articles;
  try {
    articles = await prisma.knowledgeArticle.findMany();
  } catch {
    return []; // DB unavailable — skip retrieval, never break the briefing
  }

  return articles
    .map((a) => {
      const haystack = `${a.title} ${a.content}`.toLowerCase();
      const score = tokens.reduce(
        (sum, t) => (haystack.includes(t) ? sum + 1 : sum),
        0
      );
      return { article: a, score };
    })
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((s) => ({ title: s.article.title, content: s.article.content }));
}

// ── OpenAI path ────────────────────────────────────────────────────────────

function buildUserPrompt(
  input: BriefingInput,
  ctx: BriefingContext,
  articles: KnowledgeHit[] = []
): string {
  const facts =
    `Context — location: ${ctx.location}; threat level: ${ctx.threatLevel}; regional risk: ${ctx.regionalRisk}/100; ` +
    `hospital strain: ${ctx.hospitalStrain}%; humidity: ${ctx.humidity}%; airport activity: ${ctx.airportActivity}/100; ` +
    `verified-clean survivors within 4km: ${ctx.nearbySurvivors}; best compatibility: ${ctx.compatibilityScore}.`;

  if (input.mode === "chat") {
    const knowledge =
      articles.length > 0
        ? `\n\nRelevant knowledge-base entries (draw on these and mention them by name if useful):\n` +
          articles.map((a) => `- ${a.title}: ${a.content}`).join("\n")
        : "";
    return (
      `Current situation data you may reference if relevant — ${facts}` +
      knowledge +
      `\n\nThe user just said: "${input.message ?? "Hello"}"\n\n` +
      `Reply as SafeHAIVN in a natural, human voice. Respond to what they actually said; ` +
      `only mention the situation data or knowledge-base entries if relevant. Return plain text only.`
    );
  }
  if (input.mode === "actions") {
    const convo =
      input.history && input.history.length > 0
        ? `\n\nThe user has been discussing the following — tailor and prioritize the ` +
          `actions to their stated situation, needs, and constraints:\n` +
          input.history
            .map((t) => `${t.role === "ai" ? "Assistant" : "User"}: ${t.content}`)
            .join("\n")
        : "";
    return (
      `${facts}${convo}\n\nProduce 6–8 prioritized survival actions for this situation. ` +
      `Return ONLY valid JSON: {"region":string,"threatLevel":"LOW"|"MODERATE"|"HIGH",` +
      `"actions":[{"title":string,"priority":"NOW"|"SOON"|"MONITOR","rationale":string}]}.`
    );
  }
  return (
    `${facts}\nProduce an evacuation advisory. ` +
    `Return ONLY valid JSON: {"region":string,"direction":string,` +
    `"safeZone":{"name":string,"meta":string,"verifiedClean":boolean},` +
    `"routeSteps":[{"action":string,"detail":string}],` +
    `"departureWindow":{"label":string,"timeRemaining":string,"progressPct":number}}.`
  );
}

function coerceThreat(value: unknown, fallback: ThreatLevel): ThreatLevel {
  return value === "LOW" || value === "MODERATE" || value === "HIGH"
    ? value
    : fallback;
}

/**
 * Try the OpenAI path. Returns the typed payload on success, or null on any
 * failure (missing key, network error, malformed output) so the caller can
 * fall back to the deterministic template.
 */
async function tryOpenAI(
  input: BriefingInput,
  ctx: BriefingContext,
  articles: KnowledgeHit[]
): Promise<ChatPayload | ActionsPayload | EvacuationPayload | null> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey || apiKey.trim().length === 0) return null;

  try {
    // baseURL lets us point the OpenAI SDK at any OpenAI-compatible provider
    // (Groq, DeepSeek, Ollama, …). Unset → talks to OpenAI itself.
    const client = new OpenAI({
      apiKey,
      baseURL: process.env["OPENAI_BASE_URL"] || undefined,
    });

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM },
    ];
    // Prior turns give the chatbot short-term memory (chat mode only).
    if (input.mode === "chat" && input.history) {
      for (const turn of input.history.slice(-10)) {
        messages.push({
          role: turn.role === "ai" ? "assistant" : "user",
          content: turn.content,
        });
      }
    }
    messages.push({ role: "user", content: buildUserPrompt(input, ctx, articles) });

    const r = await client.chat.completions.create({
      model: process.env["OPENAI_MODEL"] || "gpt-4o-mini",
      // Chat: high temperature for varied, human-sounding replies.
      // actions/evacuation: low temperature so the JSON stays reliable.
      temperature: input.mode === "chat" ? 0.85 : 0.4,
      messages,
    });
    const content = r.choices[0]?.message?.content?.trim();
    if (!content) return null;

    if (input.mode === "chat") {
      return { reply: content, sources: articles.map((a) => a.title) };
    }

    // actions / evacuation expect JSON — strip code fences then parse.
    const json = content.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "");
    const parsed = JSON.parse(json) as Record<string, unknown>;

    if (input.mode === "actions") {
      const rawActions = Array.isArray(parsed["actions"])
        ? (parsed["actions"] as Record<string, unknown>[])
        : [];
      const actions: ActionItem[] = rawActions.map((a) => ({
        title: String(a["title"] ?? "Action"),
        priority:
          a["priority"] === "NOW" ||
          a["priority"] === "SOON" ||
          a["priority"] === "MONITOR"
            ? a["priority"]
            : "MONITOR",
        rationale: String(a["rationale"] ?? ""),
      }));
      if (actions.length === 0) return null;
      return {
        region: String(parsed["region"] ?? ctx.location),
        threatLevel: coerceThreat(parsed["threatLevel"], ctx.threatLevel),
        actions,
      };
    }

    // evacuation
    const zone = (parsed["safeZone"] ?? {}) as Record<string, unknown>;
    const win = (parsed["departureWindow"] ?? {}) as Record<string, unknown>;
    const rawSteps = Array.isArray(parsed["routeSteps"])
      ? (parsed["routeSteps"] as Record<string, unknown>[])
      : [];
    const routeSteps = rawSteps.map((s) => ({
      action: String(s["action"] ?? ""),
      detail: String(s["detail"] ?? ""),
    }));
    if (routeSteps.length === 0) return null;
    return {
      region: String(parsed["region"] ?? ctx.location),
      direction: String(parsed["direction"] ?? "NORTH-EAST"),
      safeZone: {
        name: String(zone["name"] ?? "Safe Zone"),
        meta: String(zone["meta"] ?? ""),
        verifiedClean: Boolean(zone["verifiedClean"]),
      },
      routeSteps,
      departureWindow: {
        label: String(win["label"] ?? "DEPART WITHIN"),
        timeRemaining: String(win["timeRemaining"] ?? "2h 40m"),
        progressPct: Number(win["progressPct"]) || 64,
      },
    };
  } catch (err) {
    // Log why we fell back so the OpenAI path is debuggable (auth, quota,
    // network, malformed JSON). The request still succeeds via the template.
    console.warn(
      `[ai] OpenAI call failed, using fallback: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return null;
  }
}

/**
 * Generate a survival briefing. Always succeeds: uses OpenAI when an API key
 * is configured and the call works, otherwise a deterministic template.
 */
export async function generateBriefing(
  input: BriefingInput
): Promise<Briefing> {
  const ctx = await resolveContext(input);
  const generatedAt = new Date().toISOString();

  // RAG-lite: only chat consults the knowledge base.
  const articles =
    input.mode === "chat" ? await retrieveKnowledge(input.message) : [];

  const ai = await tryOpenAI(input, ctx, articles);
  const source = ai ? "openai" : "fallback";

  if (input.mode === "chat") {
    const payload = (ai as ChatPayload | null) ?? fallbackChat(input, ctx);
    return { mode: "chat", source, generatedAt, ...payload };
  }
  if (input.mode === "actions") {
    const payload = (ai as ActionsPayload | null) ?? fallbackActions(ctx);
    return { mode: "actions", source, generatedAt, ...payload };
  }
  const payload = (ai as EvacuationPayload | null) ?? fallbackEvacuation(ctx);
  return { mode: "evacuation", source, generatedAt, ...payload };
}
