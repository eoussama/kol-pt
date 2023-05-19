import { create } from 'zustand';
import { User } from 'firebase/auth';
import { IAuthState } from '../core/types/state/auth-state.type';



/**
 * @description
 * State management store for authentication.
 */
export const useAuthStore = create<IAuthState>(set => ({

  /**
   * @description
   * The logged in user
   */
  user: null,

  /**
   * @description
   * Logs user in
   */
  login(newUser: User): void { set({ user: newUser }) },

  /**
   * @description
   * Logs user out
   */
  logout(): void { set({ user: null }) }
}));