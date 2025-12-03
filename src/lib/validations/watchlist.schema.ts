import { z } from 'zod';

// Watchlist Create Schema
export const createWatchlistSchema = z.object({
  propertyId: z.string().cuid('ID properti tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
});

// Watchlist Delete Schema
export const deleteWatchlistSchema = z.object({
  propertyId: z.string().cuid('ID properti tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
});

export type CreateWatchlistInput = z.infer<typeof createWatchlistSchema>;
export type DeleteWatchlistInput = z.infer<typeof deleteWatchlistSchema>;

