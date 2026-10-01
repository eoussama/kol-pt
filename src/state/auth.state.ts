import type { IAuthState } from "../core/types/state/auth-state.type";

import { create } from "zustand";



/**
 * @description
 * The signed-in user. Kept in sync with extension storage by `useAuthSync`.
 */
export const useAuthStore = create<IAuthState>(set => ({
  user: null,
  ready: false,

  setUser(user) {
    set({ user, ready: true });
  },
}));
