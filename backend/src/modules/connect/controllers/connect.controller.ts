import { Request, Response, NextFunction } from "express";
import { locationSchema, swipeSchema, messageSchema } from "../schemas/connect.schema";
import type {
  SurvivorProfileResponse,
  MatchedSurvivorResponse,
  CurrentUserResponse,
  PersonalRisk,
  SurvivorView,
  UserWithStats,
  SwipeResponse,
  MessageResponse,
  EditMessageResponse,
  DeleteMessageResponse,
} from "../types/connect.types";
import type { SupplyItem } from "../types/connect.types";
import { computeResourceMitigation, riskToDanger } from "../../../lib/formulas";
import { generateText } from "../../../lib/ai";
import {
  findCurrentUser,
  findAllSurvivors,
  updateSurvivorLocation,
  createSwipe,
  ensureChatStarter,
  findMatchesBySender,
  findSurvivorsByIds,
  findUserForOpinion,
  setOpinion,
  findMessages,
  createMessage,
  scheduleAutoReply,
  updateMessageText,
  deleteMessageById,
} from "../models/connect.model";

// ─── Pure Utility Functions ───────────────────────────────────────────────────

/** Haversine formula — returns a human-readable distance string */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

/** Helper to extract quantity values from a list of dynamic supplies by their label */
function getSupplyValue(supplies: any[] | undefined, label: string): number {
  if (!supplies) return 0;
  const item = supplies.find((s) => s.label.toLowerCase() === label.toLowerCase());
  return item ? item.value : 0;
}

// ─── RiskFactor integration ───────────────────────────────────────────────────
// A survivor's supplies ARE their RiskFactor "survival statistics" (name/value/
// unit). We reuse the RiskFactor module's own formula library so the personal
// risk shown here is computed identically to the RiskFactor pages.

/**
 * Regional danger baseline (0–100) for the survivors' shared operating zone.
 * In the RiskFactor module this comes from the live regional score; here we use
 * a fixed pandemic-zone baseline so each survivor's personal risk varies only by
 * how well-supplied they are (their weakest-link statistic).
 */
const REGIONAL_BASELINE = 70;

/**
 * Map a merged `User` row into the frontend-facing survivor profile shape,
 * preserving the legacy field names (name/bio/avatarUrl/latitude/longitude) so
 * the Connect frontend is unchanged. Their statistics become `supplies`.
 */
function toSurvivorProfile(user: UserWithStats): SurvivorView {
  return {
    id: user.id,
    name: user.username,
    age: user.age ?? 0,
    bio: user.description ?? "",
    baseLocation: user.baseLocation ?? "",
    latitude: user.lat ?? 0,
    longitude: user.lng ?? 0,
    avatarUrl: user.photoUrl ?? "",
    createdAt: user.createdAt,
    supplies: user.stats.map((s) => ({
      label: s.name,
      value: s.value,
      unit: s.unit,
    })),
  };
}

/** Map a survivor's supplies to RiskFactor statistics: { name, value, unit }. */
function toStatistics(supplies: SupplyItem[] | undefined) {
  return (supplies ?? []).map((s) => ({
    name: s.label,
    value: s.value,
    unit: s.unit,
  }));
}

/**
 * Compute a survivor's personal risk factor from their statistics using the
 * RiskFactor formula: the weakest-link (minimum-value) statistic provides
 * resource mitigation that is subtracted from the regional baseline.
 */
function computePersonalRisk(supplies: SupplyItem[] | undefined): PersonalRisk {
  const statistics = toStatistics(supplies);

  let limitingStat: string | null = null;
  let limitingValue: number | null = null;
  for (const s of statistics) {
    if (limitingValue === null || s.value < limitingValue) {
      limitingValue = s.value;
      limitingStat = s.name;
    }
  }

  const mitigation =
    limitingValue === null ? 0 : computeResourceMitigation(limitingValue);
  const personalRiskScore =
    Math.round(Math.max(0, REGIONAL_BASELINE - mitigation) * 10) / 10;

  return {
    personalRiskScore,
    personalDangerLevel: riskToDanger(personalRiskScore),
    limitingStat,
    statistics,
  };
}

/** Algorithmic compatibility scoring based on supplies (medkit, waterStock, foodStock) */
function calculateCompatibility(
  medkitA: number,
  waterA: number,
  foodA: number,
  medkitB: number,
  waterB: number,
  foodB: number
): { score: number; opinion: string } {
  let score = 60;

  // 1. Complementary check (Barter potential): One survivor has surplus while other has shortage
  const waterSynergy =
    (waterA > 20 && waterB < 10 && foodB > 20 && foodA < 10) ||
    (waterB > 20 && waterA < 10 && foodA > 20 && foodB < 10);

  const medkitSynergy =
    (medkitA > 15 && medkitB < 5 && (waterB > 15 || foodB > 15)) ||
    (medkitB > 15 && medkitA < 5 && (waterA > 15 || foodA > 15));

  if (waterSynergy) {
    score += 20;
  }
  if (medkitSynergy) {
    score += 15;
  }

  // 2. Resource abundance bonus
  const combinedWater = waterA + waterB;
  const combinedFood = foodA + foodB;
  const combinedMedkits = medkitA + medkitB;

  if (combinedWater > 40 && combinedFood > 40) {
    score += 10;
  }
  if (combinedMedkits > 15) {
    score += 5;
  }

  // 3. Resource deficit penalty
  if (combinedWater < 10 || combinedFood < 10) {
    score -= 25;
  }

  score = Math.max(10, Math.min(99, score));

  let opinion = "";
  if (score >= 85) {
    opinion = `Critical Resource Synergy Detected. Supply exchange profiles represent optimal barter compatibility. Joint food reserves (${combinedFood} days) and water reserves (${combinedWater} days) guarantee prolonged defensive capability. Highly recommended connection.`;
  } else if (score >= 70) {
    opinion = `Stable tactical synergy. Resource balance is favorable. Shared inventory contains sufficient medkits (${combinedMedkits} units) for general triage requirements. Recommended connection.`;
  } else {
    opinion = `High resource deficit warning. Joint stockpile levels are below safety margins. Food (${combinedFood} days) or water (${combinedWater} days) scarcity poses severe mutual survival strain. Connection is sub-optimal.`;
  }

  return { score, opinion };
}

// Shown when a survivor has shared no description and no statistics — there's
// nothing to base an opinion on, so we skip the AI call entirely (saves quota).
const NO_INFO_OPINION =
  "Insufficient telemetry. This survivor hasn't shared a description or supply inventory yet — connect to exchange profiles before assessing compatibility.";

/** Deterministic fallback when the AI is unavailable / rate-limited. */
const FALLBACK_OPINION =
  "Profile telemetry received. Stockpile metrics logged — establish a channel to evaluate inventory synergy and operational longevity firsthand.";

/** Render a survivor's supplies as a readable inventory line. */
function describeSupplies(supplies: SupplyItem[]): string {
  if (!supplies.length) return "none listed";
  return supplies.map((s) => `${s.label}: ${s.value} ${s.unit}`).join(", ");
}

/**
 * Build a standalone opinion of one survivor (not pairwise) from their own
 * description + statistics, using the SAME AI as the chatbot (lib/ai). The
 * opinion is viewer-independent so it can be cached on the survivor.
 *
 * Returns `cacheable: false` for the no-info placeholder and the AI-unavailable
 * fallback, so neither is persisted (the no-info case costs nothing; the
 * fallback should be retried on the next view once the AI is reachable).
 */
async function buildCandidateOpinion(
  survivor: SurvivorView
): Promise<{ text: string; cacheable: boolean }> {
  const hasDescription = (survivor.bio ?? "").trim().length > 0;
  const hasStatistics = survivor.supplies.length > 0;
  if (!hasDescription && !hasStatistics)
    return { text: NO_INFO_OPINION, cacheable: false };

  const system =
    "You are a cold-war apocalypse bunker terminal AI profiling a survivor for a pandemic survival network. " +
    "Assess this survivor as a potential ally based solely on their description and supply statistics. " +
    "Reply in 2-4 short sentences, retro-terminal tone (terms like 'inventory synergy', 'stockpile metrics', 'operational longevity'). No markdown, no quotes.";

  const prompt =
    `Survivor: ${survivor.name}. ` +
    `Description: ${(survivor.bio ?? "").trim() || "none provided"}. ` +
    `Statistics — ${describeSupplies(survivor.supplies)}.\n` +
    `Provide a tactical profile assessment of this survivor as a potential ally.`;

  const text = await generateText(system, prompt, { temperature: 0.8, maxTokens: 180 });
  return text ? { text, cacheable: true } : { text: FALLBACK_OPINION, cacheable: false };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

// 1. Get current user's profile info (the authenticated account).
export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = await findCurrentUser(req.user!.id);
    if (!raw) {
      res.status(404).json({ error: "Current user profile not found." });
      return;
    }
    const profile = toSurvivorProfile(raw);
    const response: CurrentUserResponse = {
      ...profile,
      ...computePersonalRisk(profile.supplies),
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

// 2. Retrieve nearby survivors with dynamic Haversine distance & compatibility.
// The AI opinion is NOT generated here — it's fetched lazily per profile view
// (see getSurvivorOpinion) and cached, to conserve AI quota.
export async function getNearbySurvivors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = await findCurrentUser(req.user!.id);
    if (!raw) {
      res.status(404).json({ error: "Current user profile not found." });
      return;
    }
    const me = toSurvivorProfile(raw);

    const rawSurvivors = await findAllSurvivors(me.id);

    const mapped: SurvivorProfileResponse[] = rawSurvivors.map((rawSurvivor) => {
      const survivor = toSurvivorProfile(rawSurvivor);
      const distance = calculateDistance(me.latitude, me.longitude, survivor.latitude, survivor.longitude);
      const comp = calculateCompatibility(
        getSupplyValue(me.supplies, "Medkit"),
        getSupplyValue(me.supplies, "Water Stock"),
        getSupplyValue(me.supplies, "Food Stock"),
        getSupplyValue(survivor.supplies, "Medkit"),
        getSupplyValue(survivor.supplies, "Water Stock"),
        getSupplyValue(survivor.supplies, "Food Stock")
      );

      return {
        ...survivor,
        distance,
        compatibilityScore: comp.score,
        ...computePersonalRisk(survivor.supplies),
      };
    });

    res.json(mapped);
  } catch (err) {
    next(err);
  }
}

// 2b. Lazy AI opinion for one survivor — generated on first view and cached on
// the survivor; reused until they edit their description/stats (which clears it).
export async function getSurvivorOpinion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const candidate = await findUserForOpinion(req.params.id as string);
    if (!candidate) {
      res.status(404).json({ error: "Survivor not found." });
      return;
    }
    // Cache hit — reuse the stored opinion, no AI call.
    if (candidate.aiOpinion) {
      res.json({ aiOpinion: candidate.aiOpinion });
      return;
    }
    const { text, cacheable } = await buildCandidateOpinion(toSurvivorProfile(candidate));
    if (cacheable) await setOpinion(candidate.id, text);
    res.json({ aiOpinion: text });
  } catch (err) {
    next(err);
  }
}

// 3. Update Current GPS Location
export async function updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = locationSchema.parse(req.body);
    const updated = await updateSurvivorLocation(req.user!.id, parsed.latitude, parsed.longitude);
    res.json(toSurvivorProfile(updated));
  } catch (err) {
    next(err);
  }
}

// 4. Swipe Survivor Like/Love/No
export async function swipeSurvivor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = swipeSchema.parse(req.body);
    const userId = req.user!.id;

    const match = await createSwipe(userId, parsed.receiverId, parsed.status);

    if (parsed.status === "like" || parsed.status === "love") {
      await ensureChatStarter(parsed.receiverId, userId);
    }

    const response: SwipeResponse = {
      id: match.id,
      senderId: match.senderId,
      receiverId: match.receiverId,
      status: match.status as "like" | "love" | "no",
      createdAt: match.createdAt,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
}

// 5. List Matched Survivor Profiles
export async function getMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = await findCurrentUser(req.user!.id);
    if (!raw) {
      res.status(404).json({ error: "Current user profile not found." });
      return;
    }
    const me = toSurvivorProfile(raw);

    const matchedLikes = await findMatchesBySender(me.id);
    const receiverIds = matchedLikes.map((m) => m.receiverId);
    const rawMatchedProfiles = await findSurvivorsByIds(receiverIds);

    const mapped: MatchedSurvivorResponse[] = rawMatchedProfiles.map((rawSurvivor) => {
      const survivor = toSurvivorProfile(rawSurvivor);
      const distance = calculateDistance(me.latitude, me.longitude, survivor.latitude, survivor.longitude);
      const correspondingSwipe = matchedLikes.find((m) => m.receiverId === survivor.id);
      return {
        ...survivor,
        distance,
        matchType: (correspondingSwipe?.status || "like") as "like" | "love",
        ...computePersonalRisk(survivor.supplies),
      };
    });

    res.json(mapped);
  } catch (err) {
    next(err);
  }
}

// 6. Retrieve secure chat message history between you and survivor
export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const survivorId = req.params.id as string;
    const userId = req.user!.id;

    const messages = await findMessages(userId, survivorId);

    const mapped: MessageResponse[] = messages.map((m) => ({
      id: m.id,
      sender: m.senderId === userId ? "you" : "them",
      text: m.text,
      timestamp: m.timestamp,
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
}

// 7. Send Chat Message & Trigger Secure Companion Automated Reply
export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const survivorId = req.params.id as string;
    const parsed = messageSchema.parse(req.body);
    const userId = req.user!.id;

    const newMessage = await createMessage(userId, survivorId, parsed.text);
    scheduleAutoReply(survivorId, userId);

    const response: MessageResponse = {
      id: newMessage.id,
      sender: "you",
      text: newMessage.text,
      timestamp: newMessage.timestamp,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
}

// 8. Edit Secure Message Content
export async function editMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messageId = req.params.messageId as string;
    const parsed = messageSchema.parse(req.body);

    const updated = await updateMessageText(messageId, parsed.text);

    const response: EditMessageResponse = {
      id: updated.id,
      senderId: updated.senderId,
      receiverId: updated.receiverId,
      text: updated.text,
      timestamp: updated.timestamp,
      createdAt: updated.createdAt,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
}

// 9. Delete Message
export async function deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messageId = req.params.messageId as string;
    await deleteMessageById(messageId);

    const response: DeleteMessageResponse = { success: true, message: "Secure broadcast deleted." };
    res.json(response);
  } catch (err) {
    next(err);
  }
}
