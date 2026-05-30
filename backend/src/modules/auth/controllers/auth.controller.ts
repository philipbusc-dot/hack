import type { Request, Response, NextFunction } from "express";
import { validate, httpError } from "../../../lib/http";
import { signupSchema, loginSchema } from "../schemas/auth.schema";
import {
  createSurvivor,
  findByIdentifier,
  findPublicById,
} from "../models/auth.model";
import {
  verifyPassword,
  signToken,
  authCookieOptions,
  AUTH_COOKIE,
} from "../../../lib/auth";
import { getAuthUser } from "../../../middlewares/auth";

/** POST /auth/signup — creates a survivor and logs them in. */
export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validate(signupSchema, req.body);
    // Duplicate email/username → Prisma P2002 → 409 via the central handler.
    const user = await createSurvivor(input);
    res.cookie(AUTH_COOKIE, signToken({ sub: user.id, role: user.role }), authCookieOptions());
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

/** POST /auth/login — email OR username + password. */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, password } = validate(loginSchema, req.body);
    const user = await findByIdentifier(identifier);
    // Same error whether the user is missing or the password is wrong — don't
    // leak which accounts exist.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw httpError(401, "Invalid credentials");
    }
    res.cookie(AUTH_COOKIE, signToken({ sub: user.id, role: user.role }), authCookieOptions());
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role === "admin" ? "admin" : "survivor",
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /auth/logout — clear the cookie. */
export function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  res.status(204).end();
}

/** GET /auth/me — the current user, or 401. */
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuthUser(req);
    if (!auth) throw httpError(401, "Not authenticated");
    const user = await findPublicById(auth.id);
    if (!user) throw httpError(401, "Not authenticated");
    res.json(user);
  } catch (err) {
    next(err);
  }
}
