import { z } from "zod";
import { EEntryType } from "../../enums/entry-type.enum";
import { BaseEntrySchema } from "./base-entry.schema";



/**
 * @description
 * Zod schema for a cartoon entry.
 */
export const CartoonEntrySchema = BaseEntrySchema.extend({
  type: z.literal(EEntryType.CARTOON),
});

export type TCartoonEntry = z.infer<typeof CartoonEntrySchema>;
