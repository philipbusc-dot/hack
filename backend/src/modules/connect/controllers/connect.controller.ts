import { Request, Response, NextFunction } from "express";
import { locationSchema, swipeSchema, messageSchema } from "../schemas/connect.schema";
import type {
  SurvivorProfileResponse,
  MatchedSurvivorResponse,
  SwipeResponse,
  MessageResponse,
  EditMessageResponse,
  DeleteMessageResponse,
} from "../types/connect.types";
import {
  findCurrentUser,
  findAllSurvivors,
  updateSurvivorLocation,
  createSwipe,
  ensureChatStarter,
  findMatchesBySender,
  findSurvivorsByIds,
  findMessages,
  createMessage,
  scheduleAutoReply,
  updateMessageText,
  deleteMessageById,
} from "../models/connect.model";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

/** Google Gemini AI — generates a dynamic terminal-style compatibility summary based on supplies */
async function generateAIOpinion(
  medkitA: number,
  waterA: number,
  foodA: number,
  medkitB: number,
  waterB: number,
  foodB: number,
  score: number
): Promise<string> {
  const fallback =
    score >= 85
      ? `Critical Resource Synergy Detected. Supply exchange profiles represent optimal barter compatibility. Joint food reserves (${foodA + foodB} days) and water reserves (${waterA + waterB} days) guarantee prolonged defensive capability. Highly recommended connection.`
      : score >= 70
      ? `Stable tactical synergy. Resource balance is favorable. Shared inventory contains sufficient medkits (${medkitA + medkitB} units) for general triage requirements. Recommended connection.`
      : `High resource deficit warning. Joint stockpile levels are below safety margins. Food (${foodA + foodB} days) or water (${waterA + waterB} days) scarcity poses severe mutual survival strain. Connection is sub-optimal.`;

  if (!GEMINI_API_KEY) return fallback;

  try {
    const prompt = `You are a cold-war nuclear apocalypse bunker terminal AI. Write a brief, high-tech tactical summary evaluating the compatibility between two survivors based on their supplies:\nSurvivor A (You): Medkits: ${medkitA}, Water Stock: ${waterA} days, Food Stock: ${foodA} days.\nSurvivor B: Medkits: ${medkitB}, Water Stock: ${waterB} days, Food Stock: ${foodB} days.\nComputed compatibility score: ${score}%.\nStyle rules: Speak like a retro terminal mainframe AI, use terms like 'inventory synergy', 'stockpile metrics', 'operational longevity', keep it under 3-4 short sentences, do not include markdown formatting or quotes.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API responded with status ${response.status}`);

    const data = (await response.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text.trim();
  } catch (err) {
    console.error("Gemini AI API call failed, reverting to local fallback rules:", err);
  }

  return fallback;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

// 1. Get current user's profile info
export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await findCurrentUser();
    if (!user) {
      res.status(404).json({ error: "Current user profile not found." });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// 2. Retrieve nearby survivors with dynamic Haversine distance & AI compatibility
export async function getNearbySurvivors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await findCurrentUser();
    if (!user) {
      res.status(404).json({ error: "Current user profile not found." });
      return;
    }

    const rawSurvivors = await findAllSurvivors(user.id);

    const mapped: SurvivorProfileResponse[] = await Promise.all(
      rawSurvivors.map(async (survivor) => {
        const distance = calculateDistance(user.latitude, user.longitude, survivor.latitude, survivor.longitude);
        const comp = calculateCompatibility(
          getSupplyValue(user.supplies, "Medkit"),
          getSupplyValue(user.supplies, "Water Stock"),
          getSupplyValue(user.supplies, "Food Stock"),
          getSupplyValue(survivor.supplies, "Medkit"),
          getSupplyValue(survivor.supplies, "Water Stock"),
          getSupplyValue(survivor.supplies, "Food Stock")
        );
        const aiOpinion = await generateAIOpinion(
          getSupplyValue(user.supplies, "Medkit"),
          getSupplyValue(user.supplies, "Water Stock"),
          getSupplyValue(user.supplies, "Food Stock"),
          getSupplyValue(survivor.supplies, "Medkit"),
          getSupplyValue(survivor.supplies, "Water Stock"),
          getSupplyValue(survivor.supplies, "Food Stock"),
          comp.score
        );

        const supplies = (survivor.supplies || []).map((s) => ({
          label: s.label,
          value: s.value,
          unit: s.unit,
        }));

        return { ...survivor, distance, compatibilityScore: comp.score, aiOpinion, supplies };
      })
    );

    res.json(mapped);
  } catch (err) {
    next(err);
  }
}

// 3. Update Current GPS Location
export async function updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = locationSchema.parse(req.body);
    const user = await findCurrentUser();
    if (!user) {
      res.status(404).json({ error: "Current user profile not found." });
      return;
    }

    const updated = await updateSurvivorLocation(user.id, parsed.latitude, parsed.longitude);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// 4. Swipe Survivor Like/Love/No
export async function swipeSurvivor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = swipeSchema.parse(req.body);
    const user = await findCurrentUser();
    if (!user) {
      res.status(404).json({ error: "Current user profile not found." });
      return;
    }

    const match = await createSwipe(user.id, parsed.receiverId, parsed.status);

    if (parsed.status === "like" || parsed.status === "love") {
      await ensureChatStarter(parsed.receiverId, user.id);
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
    const user = await findCurrentUser();
    if (!user) {
      res.status(404).json({ error: "Current user profile not found." });
      return;
    }

    const matchedLikes = await findMatchesBySender(user.id);
    const receiverIds = matchedLikes.map((m) => m.receiverId);
    const rawMatchedProfiles = await findSurvivorsByIds(receiverIds);

    const mapped: MatchedSurvivorResponse[] = rawMatchedProfiles.map((survivor) => {
      const distance = calculateDistance(user.latitude, user.longitude, survivor.latitude, survivor.longitude);
      const correspondingSwipe = matchedLikes.find((m) => m.receiverId === survivor.id);
      const supplies = (survivor.supplies || []).map((s) => ({
        label: s.label,
        value: s.value,
        unit: s.unit,
      }));
      return { ...survivor, distance, matchType: (correspondingSwipe?.status || "like") as "like" | "love", supplies };
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
    const user = await findCurrentUser();
    if (!user) {
      res.status(404).json({ error: "Current user profile not found." });
      return;
    }

    const messages = await findMessages(user.id, survivorId);

    const mapped: MessageResponse[] = messages.map((m) => ({
      id: m.id,
      sender: m.senderId === user.id ? "you" : "them",
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
    const user = await findCurrentUser();
    if (!user) {
      res.status(404).json({ error: "Current user profile not found." });
      return;
    }

    const newMessage = await createMessage(user.id, survivorId, parsed.text);
    scheduleAutoReply(survivorId, user.id);

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
