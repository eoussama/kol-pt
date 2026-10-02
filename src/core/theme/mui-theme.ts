import type { Theme } from "@mui/material/styles";
import type { TThemeMode } from "./color-mode";

import { createTheme } from "@mui/material/styles";



const themes: Partial<Record<TThemeMode, Theme>> = {};

/**
 * @description
 * The Material UI theme for a mode. Light is Material UI's default, as the
 * extension always used; dark uses Patreon's dark surfaces.
 *
 * @param mode - The mode
 * @returns The theme, created once per mode
 */
export function getMuiTheme(mode: TThemeMode): Theme {
  themes[mode] ??= mode === "dark"
    ? createTheme({ palette: { mode: "dark", background: { default: "#121212", paper: "#272727" } } })
    : createTheme({ palette: { mode: "light" } });

  return themes[mode];
}
