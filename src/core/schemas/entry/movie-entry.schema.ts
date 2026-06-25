import { z } from "zod";
import { EEntryType } from "../../enums/entry-type.enum";
import { EntrySchema } from "./entry.schema";



/**
 * @description
 * Zod schema for a movie entry.
 */
export const MovieEntrySchema = EntrySchema.extend({
  type: z.literal(EEntryType.MOVIE),
  rottentomatoesId: z.string(),
});

export type TMovieEntry = z.infer<typeof MovieEntrySchema>;
