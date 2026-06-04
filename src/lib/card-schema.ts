import { z } from "zod";

export const raritySchema = z.enum([
  "Common",
  "Rare",
  "Epic",
  "Legendary",
  "Campus Myth",
]);

export const cardSchema = z.object({
  displayName: z.string().min(1).max(28),
  cardTitle: z.string().min(3).max(42),
  type: z.array(z.string().min(2).max(22)).min(1).max(3),
  rarity: raritySchema,
  stats: z
    .record(z.string().min(2).max(24), z.number().int().min(45).max(99))
    .refine((stats) => Object.keys(stats).length >= 4, {
      message: "A card needs at least four stats.",
    }),
  specialAbility: z.string().min(3).max(34),
  description: z.string().min(12).max(150),
  tagline: z.string().min(3).max(44),
  colorTheme: z.string().min(3).max(24),
});

export const cardRequestSchema = z.object({
  name: z.string().trim().min(1).max(28),
  theme: z.string().trim().min(1).max(40),
  traits: z.array(z.string().trim().min(2).max(30)).min(1).max(4),
  knownFor: z.string().trim().max(120).optional(),
});

export type CardIdentity = z.infer<typeof cardSchema>;
export type CardRequest = z.infer<typeof cardRequestSchema>;
