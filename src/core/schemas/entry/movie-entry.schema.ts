import { z } from "zod";
import { EEntryType } from "../../enums/entry-type.enum";
import { BaseEntrySchema } from "./base-entry.schema";



/**
 * @description
 * Zod schema for a movie entry.
 */
export const MovieEntrySchema = BaseEntrySchema.extend({
  type: z.literal(EEntryType.MOVIE),
  rottentomatoesId: z.string().optional(),
});

export type TMovieEntry = z.infer<typeof MovieEntrySchema>;
