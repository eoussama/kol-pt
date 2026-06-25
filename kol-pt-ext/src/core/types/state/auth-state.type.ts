import type { TUnsafe } from "@eoussama/core";
import type { User } from "firebase/auth";



/**
 * @description
 * Interface representing the state of the user.
 */
export interface IAuthState {

  /**
   * @description
   * The currently active user.
   */
  user: TUnsafe<User>;

  /**
   * @description
   * The login action
   */
  login: (newUser: User) => void;

  /**
   * @description
   * The logout action
   */
  logout: () => void;
}
