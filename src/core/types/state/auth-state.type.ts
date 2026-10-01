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
   * Replaces the signed-in user.
   */
  setUser: (user: IAuthUser | null) => void;
}
