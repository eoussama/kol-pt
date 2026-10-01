import { z } from "zod";
import { IdSchema, listOf, TextSchema } from "../primitives.schema";



/**
 * @description
 * Fields shared by every entry type.
 */
export const BaseEntrySchema = z.looseObject({
  id: IdSchema,
  title: TextSchema,
  imdbId: TextSchema.optional(),
  altTitles: listOf(TextSchema),
});
