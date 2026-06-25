import { z } from "zod";
import { EEntryType } from "../../enums/entry-type.enum";



/**
 * @description
 * Zod schema for a generic entry.
 */
export const EntrySchema = z.object({
  id: z.string(),
  imdbId: z.string().optional(),
  altTitles: z.array(z.string()).optional(),
  title: z.string(),
  type: z.union([
    z.literal(EEntryType.ANIME),
    z.literal(EEntryType.MOVIE),
    z.literal(EEntryType.CARTOON),
    z.literal(EEntryType.YOUTUBE),
  ]),
}).passthrough();

export type TEntry = z.infer<typeof EntrySchema>;
