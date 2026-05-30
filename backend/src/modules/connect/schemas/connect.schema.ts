import { z } from "zod";

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const swipeSchema = z.object({
  receiverId: z.string().uuid(),
  status: z.enum(["like", "love", "no"]),
});

export const messageSchema = z.object({
  text: z.string().min(1),
});

// Inferred input types for use in model / controller layers
export type LocationInput = z.infer<typeof locationSchema>;
export type SwipeInput = z.infer<typeof swipeSchema>;
export type MessageInput = z.infer<typeof messageSchema>;

