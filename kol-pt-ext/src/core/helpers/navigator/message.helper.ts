import { MessageType } from '../../enums/message-type.enum';



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
   * @param type The type of message to send
   * @param payload Optional extra data to pass
   * @param tabId The target tab's ID to send the message to
   *
   * @returns The response
   */
  static send<T = any, U = any>(type: MessageType, payload?: T, tabId?: number): Promise<U> {
    if (tabId && Boolean(chrome.tabs)) {
      return chrome.tabs.sendMessage(tabId, { type, payload });
    } else if (Boolean(chrome.runtime)) {
      return new Promise(resolve => chrome.runtime.sendMessage({ tabId, type, payload }, resolve));
    } else {
      window.postMessage(JSON.parse(JSON.stringify({ tabId, type, payload })), '*');
      return Promise.resolve(null as any);
    }
  }
}