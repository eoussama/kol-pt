import type { TThemeMode } from "../core/theme/color-mode";

import { create } from "zustand";



/**
 * @description
 * The mode the extension's UI is shown in.
 */
export interface IThemeState {

  /**
   * @description
   * Light or dark.
   */
  mode: TThemeMode;

  /**
   * @description
   * Changes the mode.
   */
  setMode: (mode: TThemeMode) => void;
}

/**
 * @description
 * State management store for the light/dark mode.
 */
export const useThemeStore = create<IThemeState>(set => ({
  mode: "light",

  setMode(mode) {
    set({ mode });
  },
}));
