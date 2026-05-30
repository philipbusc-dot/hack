// Authentication primitives: password hashing + JWT (httpOnly cookie) helpers.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/** Name of the httpOnly auth cookie. */
export const AUTH_COOKIE = "safehaivn_token";

const TOKEN_TTL = "7d";

function secret(): string {
  const s = process.env["JWT_SECRET"];
  if (s && s.length >= 16) return s;
  console.warn(
    "[auth] JWT_SECRET is missing or too short — using an INSECURE dev default. Set JWT_SECRET in .env."
  );
  return "dev-insecure-secret-change-me";
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface TokenPayload {
  sub: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign({ role: payload.role }, secret(), {
    subject: payload.sub,
    expiresIn: TOKEN_TTL,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret());
    if (
      typeof decoded === "object" &&
      typeof decoded.sub === "string" &&
      typeof decoded.role === "string"
    ) {
      return { sub: decoded.sub, role: decoded.role };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cookie options for the auth token. `lax` is fine here because the dev
 * frontend (:5173) and backend (:3000) are the same site (localhost). In
 * production behind HTTPS, `secure` flips on automatically.
 */
export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env["NODE_ENV"] === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}
