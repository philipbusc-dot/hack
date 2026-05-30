import { prisma } from "../../../db";
import { hashPassword } from "../../../lib/auth";
import type { PublicUser } from "../types/auth.types";

interface UserRow {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: Date;
}

/** Strip the password hash before a user ever leaves the server. */
function toPublic(u: UserRow): PublicUser {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role === "admin" ? "admin" : "survivor",
    createdAt: u.createdAt,
  };
}

/** Create a standard (survivor) account. Role is forced — never client-supplied. */
export async function createSurvivor(input: {
  email: string;
  username: string;
  password: string;
}): Promise<PublicUser> {
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      role: "survivor",
    },
  });
  return toPublic(user);
}

/** Find a user by email OR username (for login). Includes the hash. */
export function findByIdentifier(identifier: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
    },
  });
}

/** Public user by id (no hash). */
export async function findPublicById(id: string): Promise<PublicUser | null> {
  const u = await prisma.user.findUnique({ where: { id } });
  return u ? toPublic(u) : null;
}
