import { z } from "zod";



/**
 * @description
 * Zod schema for a tag.
 */
export const TagSchema = z.looseObject({
  id: z.string(),
  context: z.record(z.string(), z.unknown()).optional().default({}),
  entryId: z.string(),
  label: z.string(),
  description: z.string().optional().default(""),
  startTime: z.number(),
  endTime: z.number(),
});

export type TTag = z.infer<typeof TagSchema>;
