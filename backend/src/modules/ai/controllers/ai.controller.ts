import type { Request, Response, NextFunction } from "express";
import { validate } from "../../../lib/http";
import { generateBriefingSchema } from "../schemas/ai.schema";
import { generateBriefing } from "../models/briefing.model";

/**
 * POST /ai/generate-briefing — returns a chat reply, prioritized actions, or an
 * evacuation advisory depending on `mode`. Uses OpenAI when OPENAI_API_KEY is
 * set; otherwise a deterministic templated fallback. Always succeeds.
 */
export async function generate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = validate(generateBriefingSchema, req.body ?? {});
    res.json(await generateBriefing(input));
  } catch (err) {
    next(err);
  }
}
