import { z } from "zod";
import { EEntryType } from "../../enums/entry-type.enum";
import { BaseEntrySchema } from "./base-entry.schema";



/**
 * @description
 * Zod schema for a TV show entry.
 */
export const TvShowEntrySchema = BaseEntrySchema.extend({
  type: z.literal(EEntryType.TV_SHOW),
});

export type TTvShowEntry = z.infer<typeof TvShowEntrySchema>;
