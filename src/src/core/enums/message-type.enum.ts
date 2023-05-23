/**
 * @description
 * Inter-tab notification types
 */
export enum MessageType {

  /**
   * @description
   * Signifies page initialization
   */
  Init,

  /**
   * @description
   * Dictate that the page needs to attach
   * embeds to posts
   */
  Attach,

  /**
   * @description
   * Tells the service worker to load the posts
   * and forward them to the content script
   */
  Load,

  /**
   * @description
   * Notifies the extension that user is logging in
   */
  Login
}