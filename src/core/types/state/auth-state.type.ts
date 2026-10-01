import type { IAuthUser } from "../auth-user.type";



/**
 * @description
 * The signed-in user, mirrored from extension storage.
 */
export interface IAuthState {

  /**
   * @description
   * The signed-in user, or null.
   */
  user: IAuthUser | null;

  /**
   * @description
   * Whether the stored sign-in has been read yet. Until then `user` is null
   * only because nothing is known, not because nobody is signed in.
   */
  ready: boolean;

  /**
   * @description
   * Replaces the signed-in user, which also marks the sign-in as known.
   */
  setUser: (user: IAuthUser | null) => void;
}
