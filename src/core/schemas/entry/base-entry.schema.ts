import { z } from "zod";
import { IdSchema } from "../primitives.schema";



/**
 * @description
 * Fields shared by every entry type.
 */
export const BaseEntrySchema = z.looseObject({
  id: IdSchema,
  title: z.string(),
  imdbId: z.string().optional(),
  altTitles: z.array(z.string()).optional(),
});
