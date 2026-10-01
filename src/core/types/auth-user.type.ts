/**
 * @description
 * The signed-in user, as shared with the popup and the content script.
 */
export interface IAuthUser {

  /**
   * @description
   * The Firebase user ID.
   */
  uid: string;

  /**
   * @description
   * The user's email address.
   */
  email: string | null;

  /**
   * @description
   * The user's display name.
   */
  displayName: string | null;

  /**
   * @description
   * The user's profile picture.
   */
  photoURL: string | null;
}
