import { MessageType } from "../../enums/message-type.enum";



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
   * @param tabId The target tab's ID to send the message to
   * @param type The type of message to send
   * @param payload Optional extra data to pass
   *
   * @returns The response
   */
  static send<T = any, U = any>(tabId: number, type: MessageType, payload?: T): Promise<U> {
    if (Boolean(chrome.tabs)) {
      return chrome.tabs.sendMessage(tabId, { type, payload });
    } else {
      return new Promise(resolve => chrome.runtime.sendMessage({ tabId, type, payload }, resolve));
    }
  }
}