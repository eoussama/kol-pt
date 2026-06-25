import { z } from "zod";
import { EEntryType } from "../../enums/entry-type.enum";
import { EntrySchema } from "./entry.schema";



/**
 * @description
 * Zod schema for a cartoon entry.
 */
export const CartoonEntrySchema = EntrySchema.extend({
  type: z.literal(EEntryType.CARTOON),
});

export type TCartoonEntry = z.infer<typeof CartoonEntrySchema>;
