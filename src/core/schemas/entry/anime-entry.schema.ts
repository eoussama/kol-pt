import { z } from "zod";
import { EEntryType } from "../../enums/entry-type.enum";
import { EntrySchema } from "./entry.schema";



/**
 * @description
 * Zod schema for an anime entry.
 */
export const AnimeEntrySchema = EntrySchema.extend({
  type: z.literal(EEntryType.ANIME),
  malId: z.number(),
  anilistId: z.number(),
  kitsuId: z.string(),
  zoroId: z.string(),
});

export type TAnimeEntry = z.infer<typeof AnimeEntrySchema>;
