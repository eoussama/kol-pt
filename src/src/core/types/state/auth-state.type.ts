import { User } from 'firebase/auth';
import { Nullable } from '../nullable.type';



/**
 * @description
 * Interface representing the state of the user.
 */
export interface IAuthState {

  /**
   * @description
   * The currently active user.
   */
  user: Nullable<User>;

  /**
   * @description
   * The login action
   */
  login(newUser: User): void;
  
  /**
   * @description
   * The logout action
   */
  logout(): void;
}
