import { z } from "zod";
import { listOf } from "../primitives.schema";
import { AnimeEntrySchema } from "./anime-entry.schema";
import { CartoonEntrySchema } from "./cartoon-entry.schema";
import { MovieEntrySchema } from "./movie-entry.schema";
import { YouTubeEntrySchema } from "./youtube-entry.schema";



/**
 * @description
 * Zod schema for any entry, by type.
 */
export const EntrySchema = z.discriminatedUnion("type", [
  AnimeEntrySchema,
  MovieEntrySchema,
  CartoonEntrySchema,
  YouTubeEntrySchema,
]);

export type TEntry = z.infer<typeof EntrySchema>;

/**
 * @description
 * Zod schema for the entries list. Malformed entries are dropped individually.
 */
export const EntryListSchema = listOf(EntrySchema);
