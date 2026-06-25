import type { MessageType } from "../../enums/message-type.enum";
import type { Imessage } from "../../types/message.type";



/**
 * @description
 * Helps with tab notifications between the extenssion and content
 */
export class MessageHelper {
  /**
   * @description
   * Sends a notification to different parts
   * of the extenssion, used for inter-tab communication.
   *
   * @param type - The type of message to send
   * @param payload - Optional extra data to pass
   * @param tabId - The target tab's ID to send the message to
   * @returns The response
   */
  static send<T = unknown, U = unknown>(type: MessageType, payload?: T, tabId?: number): Promise<U> {
    if (tabId && Boolean(chrome.tabs)) {
      return chrome.tabs.sendMessage(tabId, { type, payload });
    }
    else if (chrome.runtime) {
      return new Promise(resolve => chrome.runtime.sendMessage({ tabId, type, payload }, resolve));
    }
    else {
      window.postMessage(JSON.parse(JSON.stringify({ tabId, type, payload })), "*");

      return Promise.resolve(null as unknown as U);
    }
  }

  /**
   * @description
   * Listens to specific message and invokes user function.
   *
   * @param callback - The function to invoke on message
   * @param _type - The type of message to invoke the function for
   */
  static listen<T = unknown>(callback: (e: Imessage<T>, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => void, _type?: MessageType): void {
    chrome.runtime.onMessage.addListener(async (e: Imessage<T>, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
      callback(e, sender, sendResponse);
    });
  }
}
