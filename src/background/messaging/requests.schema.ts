import { z } from "zod";
import { MESSAGE_CHANNEL } from "../../core/messaging/protocol";
import { SettingsSchema } from "../../core/schemas/settings.schema";



const message = <T extends string>(type: T) => z.object({ channel: z.literal(MESSAGE_CHANNEL), type: z.literal(type) });

/**
 * @description
 * Validates every request the background accepts. Must stay in line with
 * `IRequestMap`.
 */
export const RequestSchema = z.discriminatedUnion("type", [
  message("posts.list").extend({ force: z.boolean().optional() }),
  message("entries.list").extend({ force: z.boolean().optional() }),
  message("anime.info").extend({ malId: z.number().int().positive() }),
  message("youtube.channel").extend({ channelId: z.string().min(1) }),
  message("images.fetch").extend({ url: z.url({ protocol: /^https$/ }) }),
  message("auth.signIn").extend({ idToken: z.string().min(1) }),
  message("auth.signOut"),
  message("settings.get"),
  message("settings.set").extend({ settings: SettingsSchema.partial() }),
]);

/**
 * @description
 * Whether a message is meant for the extension's request handlers at all.
 *
 * @param value - Any runtime message
 * @returns True if it carries the extension's channel marker
 */
export function isOwnMessage(value: unknown): boolean {
  return typeof value === "object" && value !== null && (value as { channel?: unknown }).channel === MESSAGE_CHANNEL;
}
