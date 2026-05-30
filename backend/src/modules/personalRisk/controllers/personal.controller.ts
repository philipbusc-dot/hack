import type { Request, Response, NextFunction } from "express";
import { notFound, validate } from "../../../lib/http";
import {
  statCreateSchema,
  statUpdateSchema,
  calcSchema,
} from "../schemas/personal.schema";
import {
  listStats,
  addStat,
  updateStat,
  deleteStat,
  calculatePersonal,
} from "../models/personal.model";

export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await listStats(req.user!.id));
  } catch (err) {
    next(err);
  }
}

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

export async function calculate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { regionalScore } = validate(calcSchema, req.body);
    res.json(await calculatePersonal(req.user!.id, regionalScore));
  } catch (err) {
    next(err);
  }
}
