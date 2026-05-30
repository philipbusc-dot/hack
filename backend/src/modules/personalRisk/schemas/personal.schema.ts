import { z } from "zod";

export const statCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  value: z
    .number({ message: "value must be a number (days of supply)" })
    .min(0, "value must be >= 0")
    .max(3650, "value must be <= 3650 days"),
});

export const statUpdateSchema = statCreateSchema
  .partial()
  .refine((b) => b.name !== undefined || b.value !== undefined, {
    message: "provide at least one of name or value",
  });

export const calcSchema = z.object({
  regionalScore: z
    .number({ message: "regionalScore must be a number" })
    .min(0, "regionalScore must be >= 0")
    .max(100, "regionalScore must be <= 100"),
});

export type StatCreateInput = z.infer<typeof statCreateSchema>;
export type StatUpdateInput = z.infer<typeof statUpdateSchema>;
