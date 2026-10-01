import { z } from "zod";
import { EMessageType } from "../enums/message-type.enum";



/**
 * @description
 * Zod schema for inter-tab messages.
 */
export const MessageSchema = z.object({
  tabId: z.number().optional(),
  type: z.union([
    z.literal(EMessageType.ATTACH),
    z.literal(EMessageType.LOAD),
    z.literal(EMessageType.SYNC_REQUEST),
    z.literal(EMessageType.SYNC_RESPONSE),
    z.literal(EMessageType.FETCH_IMAGE),
    z.literal(EMessageType.FETCH_IMAGE_RESPONSE),
  ]),
  payload: z.unknown().optional(),
});

export type TMessage = z.infer<typeof MessageSchema>;
