import type { TMessageType } from "../enums/message-type.enum";



/**
 * @description
 * The definition of a message.
 * Messages are objects sent by the message helper
 * intended to exchange data between different parts
 * of the extension, like content scripts and service workers.
 *
 * @typedef T Generic type for the payload of the message.
 */
export interface Imessage<T = unknown> {

  /**
   * @description
   * The ID of the target tab
   */
  tabId: number;

  /**
   * @description
   * The type of message to send
   */
  type: TMessageType;

  /**
   * @description
   * Extra optional data to pass
   */
  payload?: T;
}
