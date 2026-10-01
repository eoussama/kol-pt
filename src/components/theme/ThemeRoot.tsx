import type { ReactNode } from "react";

import { ThemeProvider } from "@mui/material/styles";
import { getMuiTheme } from "../../core/theme/mui-theme";
import { useThemeStore } from "../../state/theme.state";



/**
 * @description
 * Gives Material UI components the current light/dark theme.
 *
 * @param props - The themed subtree
 * @param props.children - The themed subtree
 * @returns The provider
 */
export function ThemeRoot(props: { children: ReactNode }): JSX.Element {
  const mode = useThemeStore(e => e.mode);

  return <ThemeProvider theme={getMuiTheme(mode)}>{props.children}</ThemeProvider>;
}
