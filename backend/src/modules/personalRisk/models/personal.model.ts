import { prisma } from "../../../db";
import {
  computeResourceMitigation,
  riskToDanger,
} from "../../../lib/formulas";
import type {
  PersonalRiskResult,
  SurvivalStatInput,
} from "../types/personal.types";
import type { StatUpdateInput } from "../schemas/personal.schema";

// These statistics are the authenticated user's own SurvivalStat rows — the
// same data the Profile/settings page edits. Editing here or there is equivalent.

/**
 * Clear the cached Connect AI opinion so it regenerates on next view — stats
 * changed, so any opinion based on them is stale. Mirrors the profile module.
 */
async function invalidateOpinion(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { aiOpinion: null } });
}

export async function listStats(userId: string) {
  return prisma.survivalStat.findMany({
    where: { userId },
    orderBy: { id: "asc" },
  });
}

export async function addStat(userId: string, input: SurvivalStatInput) {
  const stat = await prisma.survivalStat.create({
    data: { name: input.name, value: input.value, unit: input.unit, userId },
  });
  await invalidateOpinion(userId);
  return stat;
}

export async function updateStat(
  userId: string,
  id: string,
  input: StatUpdateInput
) {
  const { count } = await prisma.survivalStat.updateMany({
    where: { id, userId },
    data: input,
  });
  if (count === 0) return null;
  await invalidateOpinion(userId);
  return prisma.survivalStat.findUnique({ where: { id } });
}

export async function deleteStat(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.survivalStat.deleteMany({
    where: { id, userId },
  });
  if (count === 0) return false;
  await invalidateOpinion(userId);
  return true;
}

export async function calculatePersonal(
  userId: string,
  regionalScore: number
): Promise<PersonalRiskResult> {
  const stats = await listStats(userId);

  let limitingDays: number | null = null;
  let limitingStat: string | null = null;
  for (const s of stats) {
    if (limitingDays === null || s.value < limitingDays) {
      limitingDays = s.value;
      limitingStat = s.name;
    }
  }

  const resourceMitigation =
    limitingDays === null ? 0 : computeResourceMitigation(limitingDays);
  const psi = Math.round(Math.max(0, regionalScore - resourceMitigation) * 10) / 10;

  return {
    regionalScore,
    limitingDays,
    limitingStat,
    resourceMitigation,
    psi,
    dangerLevel: riskToDanger(psi),
    stats,
  };
}
