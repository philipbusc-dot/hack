// Auth middleware: read the JWT cookie, gate routes by login / role.
// Self-contained (parses the cookie itself), so any feature can protect a
// route by just dropping `requireAuth` / `requireAdmin` in front of it.
import type { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE, verifyToken } from "../lib/auth";
import { httpError } from "../lib/http";

export interface AuthUser {
  id: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Resolve the current user from the auth cookie, or null. */
export function getAuthUser(req: Request): AuthUser | null {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return null;
  const payload = verifyToken(token);
  return payload ? { id: payload.sub, role: payload.role } : null;
}

/** Require any logged-in user; attaches req.user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) return next(httpError(401, "Authentication required"));
  req.user = user;
  next();
}

/** Require an admin; attaches req.user. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) return next(httpError(401, "Authentication required"));
  if (user.role !== "admin") return next(httpError(403, "Admin access required"));
  req.user = user;
  next();
}
