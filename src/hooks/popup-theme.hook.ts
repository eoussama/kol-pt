import type { TPatreonColorMode } from "../core/theme/color-mode";

import { useEffect } from "react";
import { patreonColorModeItem } from "../core/storage/items";
import { applyThemeAttribute, DARK_SCHEME_QUERY, isSystemDark, resolveThemeMode } from "../core/theme/color-mode";
import { useThemeStore } from "../state/theme.state";



/**
 * @description
 * Matches the popup to Patreon's appearance, as last seen on a Patreon page,
 * or to the system's until Patreon has been visited. Use once, at the root.
 */
export function usePopupTheme(): void {
  const setMode = useThemeStore(e => e.setMode);

  useEffect(() => {
    let patreonMode: TPatreonColorMode | null = null;

    const update = () => {
      const mode = resolveThemeMode(patreonMode, isSystemDark());

      applyThemeAttribute(mode);
      setMode(mode);
    };

    update();

    patreonColorModeItem.getValue().then((value) => {
      patreonMode = value;
      update();
    }).catch(() => undefined);

    const unwatch = patreonColorModeItem.watch((value) => {
      patreonMode = value;
      update();
    });

    const media = matchMedia(DARK_SCHEME_QUERY);

    media.addEventListener("change", update);

    return () => {
      unwatch();
      media.removeEventListener("change", update);
    };
  }, [setMode]);
}
