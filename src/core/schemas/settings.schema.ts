import { z } from "zod";
import { EViewMode } from "../enums/view-mode.enum";



/**
 * @description
 * Zod schema for user settings.
 */
export const SettingsSchema = z.object({
  viewMode: z.union([
    z.literal(EViewMode.COMPACT),
    z.literal(EViewMode.EXPANDED),
  ]),
});

export type TSettings = z.infer<typeof SettingsSchema>;
