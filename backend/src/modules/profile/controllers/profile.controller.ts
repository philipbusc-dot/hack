import type { Request, Response, NextFunction } from "express";
import { unlink } from "node:fs/promises";
import { basename, join } from "node:path";
import { httpError, notFound, validate } from "../../../lib/http";
import { UPLOAD_DIR } from "../../../lib/upload";
import {
  profileUpdateSchema,
  statCreateSchema,
  statUpdateSchema,
} from "../schemas/profile.schema";
import {
  getProfile,
  updateProfile,
  setUserPhoto,
  addStat,
  updateStat,
  deleteStat,
} from "../models/profile.model";

/** Best-effort removal of a previously uploaded file (ignores missing files). */
async function removeUploadedFile(url: string): Promise<void> {
  if (!url.includes("/uploads/")) return; // never touch non-upload URLs
  try {
    const name = basename(new URL(url).pathname);
    if (name) await unlink(join(UPLOAD_DIR, name));
  } catch {
    /* file already gone — nothing to do */
  }
}

// GET /profile — the logged-in user's profile + statistics.
export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const profile = await getProfile(req.user!.id);
    if (!profile) throw notFound("Profile");
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

// PATCH /profile — update name (username) and/or about (description).
export async function patchMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = validate(profileUpdateSchema, req.body);
    const profile = await updateProfile(req.user!.id, input);
    if (!profile) throw notFound("Profile");
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

// POST /profile/photo — upload a new profile picture (multipart, field "photo").
// Replaces and deletes the previous image.
export async function uploadPhoto(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) throw httpError(400, "No image uploaded (field 'photo').");
    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const previous = await setUserPhoto(req.user!.id, url);
    if (previous) await removeUploadedFile(previous);
    res.json(await getProfile(req.user!.id));
  } catch (err) {
    next(err);
  }
}

// POST /profile/stats — add a survival statistic.
export async function createStat(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = validate(statCreateSchema, req.body);
    res.status(201).json(await addStat(req.user!.id, input));
  } catch (err) {
    next(err);
  }
}

// PATCH /profile/stats/:id — edit one of your statistics.
export async function patchStat(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = validate(statUpdateSchema, req.body);
    const stat = await updateStat(req.user!.id, req.params["id"] as string, input);
    if (!stat) throw notFound("Stat");
    res.json(stat);
  } catch (err) {
    next(err);
  }
}

// DELETE /profile/stats/:id — remove one of your statistics.
export async function removeStat(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ok = await deleteStat(req.user!.id, req.params["id"] as string);
    if (!ok) throw notFound("Stat");
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
