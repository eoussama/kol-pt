import { z } from "zod";
import { EEntryType } from "../../enums/entry-type.enum";
import { NumberLikeSchema, TextSchema } from "../primitives.schema";
import { BaseEntrySchema } from "./base-entry.schema";



/**
 * @description
 * Zod schema for an anime entry.
 */
export const AnimeEntrySchema = BaseEntrySchema.extend({
  type: z.literal(EEntryType.ANIME),
  malId: NumberLikeSchema.optional(),
  anilistId: NumberLikeSchema.optional(),
  kitsuId: TextSchema.optional(),
});

export type TAnimeEntry = z.infer<typeof AnimeEntrySchema>;
