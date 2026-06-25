/**
 * @description
 * Inter-tab notification types.
 */
export const EMessageType = {
  /**
   * @description
   * Signifies page initialization.
   */
  INIT: 0,

  /**
   * @description
   * Dictate that the page needs to attach embeds to posts.
   */
  ATTACH: 1,

  /**
   * @description
   * Tells the service worker to load the posts and forward them to the content script.
   */
  LOAD: 2,

  /**
   * @description
   * Sent by the content to request state syncing.
   */
  SYNC_REQUEST: 3,

  /**
   * @description
   * Sent by the background as a response for state syncing.
   */
  SYNC_RESPONSE: 4,
} as const;

export type TMessageType = (typeof EMessageType)[keyof typeof EMessageType];
