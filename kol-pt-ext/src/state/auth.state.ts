import type { User } from "firebase/auth";
import type { IAuthState } from "../core/types/state/auth-state.type";
import { create } from "zustand";



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
   *
   * @param newUser - The authenticated user
   */
  login(newUser: User): void { set({ user: newUser }); },

  /**
   * @description
   * Logs user out
   */
  logout(): void { set({ user: null }); },
}));
