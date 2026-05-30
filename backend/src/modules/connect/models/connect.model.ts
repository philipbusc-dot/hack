import { prisma } from "../../../db";
import type { Survivor, Match, ChatMessage } from "../types/connect.types";

// ─── Survivor Queries ─────────────────────────────────────────────────────────

/** Returns the survivor flagged as the current user, or null if none exists */
export async function findCurrentUser(): Promise<Survivor | null> {
  return prisma.survivor.findFirst({
    where: { isCurrentUser: true },
    include: { supplies: true },
  }) as unknown as Promise<Survivor | null>;
}

/** Returns all survivors that are NOT the current user and have NOT been swiped by the current user */
export async function findAllSurvivors(currentUserId: string): Promise<Survivor[]> {
  const swipes = await prisma.match.findMany({
    where: { senderId: currentUserId },
    select: { receiverId: true },
  });
  const swipedIds = swipes.map((s) => s.receiverId);

  return prisma.survivor.findMany({
    where: {
      isCurrentUser: false,
      id: { notIn: swipedIds },
    },
    include: { supplies: true },
  }) as unknown as Promise<Survivor[]>;
}

/** Updates the GPS coordinates of a specific survivor */
export async function updateSurvivorLocation(
  id: string,
  latitude: number,
  longitude: number
): Promise<Survivor> {
  return prisma.survivor.update({
    where: { id },
    data: { latitude, longitude },
    include: { supplies: true },
  }) as unknown as Promise<Survivor>;
}

/** Returns a list of survivors by their IDs */
export async function findSurvivorsByIds(ids: string[]): Promise<Survivor[]> {
  return prisma.survivor.findMany({
    where: { id: { in: ids } },
    include: { supplies: true },
  }) as unknown as Promise<Survivor[]>;
}

// ─── Match (Swipe) Queries ────────────────────────────────────────────────────

/** Persists a new swipe action between two survivors */
export async function createSwipe(
  senderId: string,
  receiverId: string,
  status: "like" | "love" | "no"
): Promise<Match> {
  return prisma.match.create({ data: { senderId, receiverId, status } });
}

/**
 * Finds all matches (like / love) where the given user is the sender.
 * Used to build the matched-survivors list.
 */
export async function findMatchesBySender(senderId: string): Promise<Match[]> {
  return prisma.match.findMany({
    where: { senderId, status: { in: ["like", "love"] } },
  });
}

// ─── Chat Message Queries ─────────────────────────────────────────────────────

/**
 * Ensures a starter message exists from the matched survivor to the current user.
 * Only creates one if none already exists (idempotent).
 */
export async function ensureChatStarter(
  survivorId: string,
  userId: string
): Promise<void> {
  const existing = await prisma.chatMessage.findFirst({
    where: { senderId: survivorId, receiverId: userId },
  });

  if (!existing) {
    await prisma.chatMessage.create({
      data: {
        senderId: survivorId,
        receiverId: userId,
        text: "Secure frequency established. Broadcast channel open.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    });
  }
}

/**
 * Returns all messages exchanged between two survivors, ordered chronologically.
 */
export async function findMessages(
  userIdA: string,
  userIdB: string
): Promise<ChatMessage[]> {
  return prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: userIdA, receiverId: userIdB },
        { senderId: userIdB, receiverId: userIdA },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Creates a new outbound message from the current user to a survivor */
export async function createMessage(
  senderId: string,
  receiverId: string,
  text: string
): Promise<ChatMessage> {
  return prisma.chatMessage.create({
    data: {
      senderId,
      receiverId,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  });
}

/**
 * Fires an automated reply from a matched survivor after a 1-second delay.
 * Silently swallows errors so the parent response is never affected.
 */
export function scheduleAutoReply(survivorId: string, userId: string): void {
  const replies = [
    "That sounds intense. I'm keeping watch near bunker gates.",
    "We should plan a scavenge run soon. Let me know when you're free.",
    "Copy that. Signal quality is dropping, but I'm still online.",
    "Roger. Keep your geiger counter handy!",
    "bro I forgot the deadline was today 💀",
    "can you send me the file again?",
    "honestly I didn't expect this project to become this complicated 😭",
  ];

  setTimeout(async () => {
    try {
      const survivor = await prisma.survivor.findUnique({ where: { id: survivorId } });
      if (!survivor) return;

      const randomText = replies[Math.floor(Math.random() * replies.length)];

      await prisma.chatMessage.create({
        data: {
          senderId: survivorId,
          receiverId: userId,
          text: randomText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      });
    } catch (err) {
      console.error("Failed to append secure mock auto-reply:", err);
    }
  }, 1000);
}

/** Updates the text of an existing message */
export async function updateMessageText(
  messageId: string,
  text: string
): Promise<ChatMessage> {
  return prisma.chatMessage.update({
    where: { id: messageId },
    data: { text },
  });
}

/** Permanently deletes a message by its ID */
export async function deleteMessageById(messageId: string): Promise<void> {
  await prisma.chatMessage.delete({ where: { id: messageId } });
}
