import type { Browser } from "wxt/browser";
import type { TMessageType } from "../../enums/message-type.enum";
import type { Imessage } from "../../types/message.type";

import { browser } from "wxt/browser";
import { MessageSchema } from "../../schemas/message.schema";



/**
 * @description
 * Helps with tab notifications between the extension and content
 */
export class MessageHelper {
  /**
   * @description
   * Sends a notification to different parts
   * of the extension, used for inter-tab communication.
   *
   * @param type - The type of message to send
   * @param payload - Optional extra data to pass
   * @param tabId - The target tab's ID to send the message to
   * @returns The response
   */
  static send<T = unknown, U = unknown>(type: TMessageType, payload?: T, tabId?: number): Promise<U> {
    const request = tabId && browser.tabs
      ? browser.tabs.sendMessage(tabId, { type, payload })
      : browser.runtime.sendMessage({ tabId, type, payload });

    // The receiving end may not exist (tab closed, no content script yet)
    return (request as Promise<U>).catch(() => undefined as U);
  }

  /**
   * @description
   * Listens to specific message and invokes user function.
   *
   * @param callback - The function to invoke on message
   * @param type - The type of message to invoke the function for, all types if omitted
   */
  static listen<T = unknown>(callback: (e: Imessage<T>, sender: Browser.runtime.MessageSender) => void, type?: TMessageType): void {
    browser.runtime.onMessage.addListener((raw: unknown, sender: Browser.runtime.MessageSender) => {
      const parsed = MessageSchema.safeParse(raw);

      if (!parsed.success || (type !== undefined && parsed.data.type !== type)) {
        return;
      }

      callback(parsed.data as Imessage<T>, sender);
    });
  }
}
