import { prisma } from "../../../db";
import type { Profile } from "../types/profile.types";
import type {
  ProfileUpdateInput,
  StatCreateInput,
  StatUpdateInput,
} from "../schemas/profile.schema";

type UserWithStats = {
  id: string;
  email: string;
  username: string;
  description: string | null;
  photoUrl: string | null;
  role: string;
  stats: { id: string; name: string; value: number; unit: string }[];
};

function toProfile(u: UserWithStats): Profile {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    description: u.description,
    photoUrl: u.photoUrl,
    role: u.role === "admin" ? "admin" : "survivor",
    stats: u.stats.map((s) => ({
      id: s.id,
      name: s.name,
      value: s.value,
      unit: s.unit,
    })),
  };
}

/** The authenticated user's profile + their statistics (oldest first). */
export async function getProfile(userId: string): Promise<Profile | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: { stats: { orderBy: { id: "asc" } } },
  });
  return u ? toProfile(u as unknown as UserWithStats) : null;
}

/** Update name (username) and/or about (description); returns the fresh profile. */
export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput
): Promise<Profile | null> {
  await prisma.user.update({ where: { id: userId }, data: input });
  return getProfile(userId);
}

/** Set the user's photo URL; returns the previous URL (so its file can be removed). */
export async function setUserPhoto(
  userId: string,
  photoUrl: string
): Promise<string | null> {
  const prev = await prisma.user.findUnique({
    where: { id: userId },
    select: { photoUrl: true },
  });
  await prisma.user.update({ where: { id: userId }, data: { photoUrl } });
  return prev?.photoUrl ?? null;
}

export async function addStat(userId: string, input: StatCreateInput) {
  return prisma.survivalStat.create({
    data: { name: input.name, value: input.value, unit: input.unit, userId },
  });
}

export async function updateStat(
  userId: string,
  id: string,
  input: StatUpdateInput
) {
  // Scope by userId so a user can only edit their own statistics.
  const { count } = await prisma.survivalStat.updateMany({
    where: { id, userId },
    data: input,
  });
  if (count === 0) return null;
  return prisma.survivalStat.findUnique({ where: { id } });
}

export async function deleteStat(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.survivalStat.deleteMany({
    where: { id, userId },
  });
  return count > 0;
}
