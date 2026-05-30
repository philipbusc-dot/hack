import { z } from "zod";

/**
 * Body schema for POST /ai/generate-briefing. Everything is optional with
 * sensible defaults — missing context is derived from the DB server-side.
 */
export const generateBriefingSchema = z.object({
  mode: z.enum(["chat", "actions", "evacuation"]).default("chat"),
  message: z.string().trim().max(2000).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "ai"]),
        content: z.string().trim().min(1).max(4000),
      })
    )
    .max(20)
    .optional(),
  location: z.string().trim().min(1).max(120).optional(),
  regionalRisk: z.number().min(0).max(100).optional(),
  hospitalStrain: z.number().min(0).optional(),
  humidity: z.number().min(0).max(100).optional(),
  airportActivity: z.number().min(0).optional(),
  nearbySurvivors: z.number().min(0).optional(),
  compatibilityScore: z.number().min(0).max(100).optional(),
});

export type GenerateBriefingSchema = z.infer<typeof generateBriefingSchema>;
