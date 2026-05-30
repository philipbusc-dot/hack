import { z } from "zod";

// PATCH /profile — update the editable profile fields. `username` mirrors the
// account handle (must stay unique); `description` is the "about me" text.
export const profileUpdateSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "name must be at least 3 characters")
      .max(24, "name must be at most 24 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "name may only contain letters, numbers, and underscores"
      )
      .optional(),
    description: z
      .string()
      .trim()
      .max(300, "about must be at most 300 characters")
      .optional(),
  })
  .refine((b) => b.username !== undefined || b.description !== undefined, {
    message: "provide at least one of username or description",
  });

// Statistics mirror the RiskFactor SurvivalStat shape: name + value + unit.
export const statCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  value: z
    .number({ message: "value must be a number" })
    .min(0, "value must be >= 0")
    .max(3650, "value must be <= 3650"),
  unit: z
    .string()
    .trim()
    .min(1, "unit must not be empty")
    .max(20, "unit must be <= 20 characters")
    .optional(),
});

export const statUpdateSchema = statCreateSchema
  .partial()
  .refine((b) => b.name !== undefined || b.value !== undefined || b.unit !== undefined, {
    message: "provide at least one of name, value, or unit",
  });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type StatCreateInput = z.infer<typeof statCreateSchema>;
export type StatUpdateInput = z.infer<typeof statUpdateSchema>;
