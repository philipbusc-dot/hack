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

/** Bangkok default locale (design canon). Used for DB-derived defaults. */
const BANGKOK = { name: "Bangkok", lat: 13.7563, lng: 100.5018 };

/** Guardrail-encoding system prompt for the OpenAI path. */
const SYSTEM =
  "You are an apocalypse survival intelligence system. Generate concise emergency survival briefings. " +
  "DO NOT diagnose disease. DO NOT prescribe medicine. DO NOT act like a doctor. You should: explain danger levels, " +
  "explain environmental risks, recommend safe actions, recommend evacuation strategies, analyze survivor compatibility. " +
  "Tactical/emergency tone. Keep it tight (3–5 sentences for chat).";

/** Great-circle distance in km between two lat/lng points. */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Resolve the live briefing context: body values win, otherwise derive
 * defaults from the DB (Bangkok Metropolis region + nearby verified-clean
 * survivors). Defaults to Bangkok / HIGH threat when the DB is empty.
 */
export async function resolveContext(
  input: BriefingInput
): Promise<BriefingContext> {
  let regionalRisk = input.regionalRisk;
  let hospitalStrain = input.hospitalStrain;
  let humidity = input.humidity;
  let airportActivity = input.airportActivity;
  let nearbySurvivors = input.nearbySurvivors;
  let compatibilityScore = input.compatibilityScore;

  // Pull the Bangkok region snapshot for any missing environmental factor.
  if (
    regionalRisk === undefined ||
    hospitalStrain === undefined ||
    humidity === undefined ||
    airportActivity === undefined
  ) {
    try {
      const region =
        (await prisma.regionRisk.findFirst({
          where: { regionName: "Bangkok Metropolis" },
        })) ??
        (await prisma.regionRisk.findFirst({
          orderBy: { regionalRisk: "desc" },
        }));
      if (region) {
        regionalRisk ??= region.regionalRisk;
        hospitalStrain ??= region.hospitalStrain;
        humidity ??= region.humidity;
        airportActivity ??= region.airportTraffic;
      }
    } catch {
      /* DB unavailable — fall through to literal defaults below */
    }
  }

  // Count verified-clean survivors within ~4km of Bangkok + best compatibility.
  if (nearbySurvivors === undefined || compatibilityScore === undefined) {
    try {
      const mates = await prisma.survivorMate.findMany({
        where: { verifiedClean: true },
      });
      const near = mates.filter(
        (m) =>
          haversineKm(BANGKOK.lat, BANGKOK.lng, m.latitude, m.longitude) <= 4
      );
      nearbySurvivors ??= near.length;
      const pool = near.length > 0 ? near : mates;
      compatibilityScore ??=
        pool.length > 0
          ? Math.round(Math.max(...pool.map((m) => m.compatibilityScore)))
          : 0;
    } catch {
      /* DB unavailable — fall through to literal defaults below */
    }
  }

  const resolvedRisk = regionalRisk ?? 78;
  return {
    location: input.location ?? BANGKOK.name,
    threatLevel: riskToDanger(resolvedRisk),
    regionalRisk: resolvedRisk,
    hospitalStrain: hospitalStrain ?? 88,
    humidity: humidity ?? 74,
    airportActivity: airportActivity ?? 92,
    nearbySurvivors: nearbySurvivors ?? 3,
    compatibilityScore: compatibilityScore ?? 91,
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

// ── OpenAI path ────────────────────────────────────────────────────────────

function buildUserPrompt(input: BriefingInput, ctx: BriefingContext): string {
  const facts =
    `Context — location: ${ctx.location}; threat level: ${ctx.threatLevel}; regional risk: ${ctx.regionalRisk}/100; ` +
    `hospital strain: ${ctx.hospitalStrain}%; humidity: ${ctx.humidity}%; airport activity: ${ctx.airportActivity}/100; ` +
    `verified-clean survivors within 4km: ${ctx.nearbySurvivors}; best compatibility: ${ctx.compatibilityScore}.`;

  if (input.mode === "chat") {
    return (
      `${facts}\nUser question: "${input.message ?? "Is it safe to stay where I am?"}"\n` +
      `Answer in 3–5 tactical sentences grounded in the context. Return plain text only.`
    );
  }
  if (input.mode === "actions") {
    return (
      `${facts}\nProduce 6–8 prioritized survival actions for this situation. ` +
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
  ctx: BriefingContext
): Promise<ChatPayload | ActionsPayload | EvacuationPayload | null> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey || apiKey.trim().length === 0) return null;

  try {
    const client = new OpenAI({ apiKey });
    const r = await client.chat.completions.create({
      model: process.env["OPENAI_MODEL"] || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildUserPrompt(input, ctx) },
      ],
    });
    const content = r.choices[0]?.message?.content?.trim();
    if (!content) return null;

    if (input.mode === "chat") {
      return { reply: content };
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
  } catch {
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

  const ai = await tryOpenAI(input, ctx);
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
