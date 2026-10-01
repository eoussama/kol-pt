/**
 * @description
 * The extension's two looks.
 */
export type TThemeMode = "light" | "dark";

/**
 * @description
 * Patreon's appearance setting, as found on `<html data-token-color-mode>`:
 * `auto` follows the system, `inverted` is the opposite of it.
 */
export type TPatreonColorMode = "light" | "dark" | "auto" | "inverted";

/**
 * @description
 * The attribute Patreon sets on `<html>` for its appearance setting.
 */
export const PATREON_COLOR_MODE_ATTRIBUTE = "data-token-color-mode";

/**
 * @description
 * The media query for a dark system appearance.
 */
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/**
 * @description
 * Reads Patreon's appearance setting. Anything unexpected counts as `auto`.
 *
 * @param value - The attribute's value
 * @returns The appearance setting
 */
export function toPatreonColorMode(value: string | null | undefined): TPatreonColorMode {
  return value === "light" || value === "dark" || value === "inverted" ? value : "auto";
}

/**
 * @description
 * Decides between light and dark from Patreon's setting and the system's.
 *
 * @param patreonMode - Patreon's appearance setting, or null if unknown
 * @param systemDark - Whether the system appearance is dark
 * @returns The mode to use
 */
export function resolveThemeMode(patreonMode: TPatreonColorMode | null, systemDark: boolean): TThemeMode {
  switch (patreonMode) {
    case "light": return "light";

    case "dark": return "dark";

    case "inverted": return systemDark ? "light" : "dark";

    default: return systemDark ? "dark" : "light";
  }
}

/**
 * @description
 * Tells whether a CSS color is dark, by its relative luminance.
 *
 * @param value - A `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` or `rgb()`/`rgba()` color
 * @returns True if dark, false if light, null if the color cannot be read
 */
export function isDarkColor(value: string): boolean | null {
  const color = value.trim().toLowerCase();
  let channels: Array<number> | null = null;

  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(color)?.[1];

  if (hex) {
    const full = hex.length <= 4 ? [...hex].map(c => c + c).join("") : hex;

    channels = [0, 2, 4].map(i => Number.parseInt(full.slice(i, i + 2), 16));
  }
  else {
    const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(color);

    channels = rgb ? rgb.slice(1, 4).map(Number) : null;
  }

  if (!channels) {
    return null;
  }

  const [r = 0, g = 0, b = 0] = channels.map((c) => {
    const s = c / 255;

    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4;
}

/**
 * @description
 * Whether the system appearance is dark.
 *
 * @returns True for a dark system appearance
 */
export function isSystemDark(): boolean {
  return typeof matchMedia === "function" && matchMedia(DARK_SCHEME_QUERY).matches;
}

/**
 * @description
 * Switches the extension's CSS variables between light and dark, through
 * `data-kolpt-theme` on `<html>`.
 *
 * @param mode - The mode to use
 * @param root - The document's root element
 */
export function applyThemeAttribute(mode: TThemeMode, root: HTMLElement = document.documentElement): void {
  const current = root.getAttribute("data-kolpt-theme");

  // Only touch the page when something differs, so this is safe to call often
  if (mode === "dark" && current !== "dark") {
    root.setAttribute("data-kolpt-theme", "dark");
  }
  else if (mode === "light" && current !== null) {
    root.removeAttribute("data-kolpt-theme");
  }
}
