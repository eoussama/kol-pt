import { MessageType } from "../enums/message-type.enum";



/**
 * @description
 * The definition of a message.
 * Messages are objects sent by the message helper
 * intended to exchange data between differet parts
 * of the extenssion, like content scripts and service workers.
 *
 * @typedef T Generic type for the payload of the message.
 */
export interface Imessage<T = any> {

  /**
   * @description
   * The ID of the tagret tab
   */
  tabId: number;

  /**
   * @description
   * The type of message to send
   */
  type: MessageType;

  /**
   * @description
   * Extra optional data to pass
   */
  payload?: T;
}