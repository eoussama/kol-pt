import type { TPatreonColorMode, TThemeMode } from "../../core/theme/color-mode";

import { DARK_SCHEME_QUERY, isDarkColor, isSystemDark, PATREON_COLOR_MODE_ATTRIBUTE, resolveThemeMode, toPatreonColorMode } from "../../core/theme/color-mode";
import { PatreonSelectors } from "./selectors";



/**
 * @description
 * Patreon's design token for card backgrounds: white in its light
 * appearance, near black in its dark one.
 */
const SURFACE_TOKEN = "--global-bg-base-default";

/**
 * @description
 * How often the appearance is checked regardless of page changes, in milliseconds.
 */
const RECHECK_MS = 2000;

/**
 * @description
 * Theme watcher options.
 */
export interface IThemeWatcherOptions {

  /**
   * @description
   * Called once immediately, then whenever the appearance changes, with the
   * mode to use and the appearance setting to remember for the popup.
   */
  onChange: (mode: TThemeMode, patreonMode: TPatreonColorMode) => void;

  /**
   * @description
   * Called on every check with the mode in effect, even when it did not
   * change. The page may undo what was applied for it, such as an attribute
   * on `<html>` that Patreon's own code re-renders away.
   */
  onCheck?: (mode: TThemeMode) => void;

  /**
   * @description
   * Stops the watcher when aborted.
   */
  signal: AbortSignal;

  /**
   * @description
   * The page's document.
   */
  doc?: Document;
}

/**
 * @description
 * Reads a computed `rgb()`/`rgba()` color.
 *
 * @param value - A computed color
 * @returns The color's channels and opacity, or null if it cannot be read
 */
function parseComputedColor(value: string): { color: string; alpha: number } | null {
  const match = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const alpha = match[4] === undefined ? 1 : (match[4].endsWith("%") ? Number.parseFloat(match[4]) / 100 : Number.parseFloat(match[4]));

  return { color: `rgb(${match[1]}, ${match[2]}, ${match[3]})`, alpha };
}

/**
 * @description
 * Reads the appearance Patreon actually renders: the first opaque background
 * behind the posts, which is what the panel sits on. Falls back to Patreon's
 * card background token.
 *
 * @param doc - The page's document
 * @returns The rendered mode, or null if it cannot be told
 */
export function measurePatreonMode(doc: Document = document): TThemeMode | null {
  const start = doc.querySelector(PatreonSelectors.card) ?? doc.getElementById("main-content") ?? doc.body;

  for (let element: Element | null = start; element; element = element.parentElement) {
    const background = parseComputedColor(getComputedStyle(element).backgroundColor);

    if (background && background.alpha >= 0.9) {
      const dark = isDarkColor(background.color);

      return dark === null ? null : (dark ? "dark" : "light");
    }
  }

  const token = start ? getComputedStyle(start).getPropertyValue(SURFACE_TOKEN) : "";
  const dark = token ? isDarkColor(token) : null;

  return dark === null ? null : (dark ? "dark" : "light");
}

/**
 * @description
 * Follows Patreon's light/dark appearance: what the page renders when its
 * design tokens can be read, otherwise its appearance setting and, for the
 * `auto` setting, the system's appearance.
 *
 * @param options - The watcher options
 * @returns A function that checks again, e.g. after Patreon re-rendered
 */
export function watchPatreonTheme(options: IThemeWatcherOptions): () => void {
  const { onChange, signal, doc = document } = options;
  let last: string | null = null;

  const update = () => {
    if (signal.aborted) {
      return;
    }

    const setting = toPatreonColorMode(doc.documentElement.getAttribute(PATREON_COLOR_MODE_ATTRIBUTE));
    const expected = resolveThemeMode(setting, isSystemDark());
    const measured = measurePatreonMode(doc);
    const mode = measured ?? expected;

    // When the page disagrees with its own setting, remember what it shows
    const patreonMode: TPatreonColorMode = measured === null || measured === expected ? setting : measured;
    const key = `${mode}/${patreonMode}`;

    options.onCheck?.(mode);

    if (key !== last) {
      last = key;
      onChange(mode, patreonMode);
    }
  };

  // Patreon may switch its theme on html, body or a container deeper in the
  // page, and when its stylesheets finish loading, so the whole page is
  // watched, throttled, with a slow re-check as a safety net.
  let scheduled: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    scheduled ??= setTimeout(() => {
      scheduled = undefined;
      update();
    }, 150);
  };

  const observer = new MutationObserver(schedule);

  observer.observe(doc.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: [PATREON_COLOR_MODE_ATTRIBUTE, "class", "style", "data-theme", "data-kolpt-theme"],
  });

  const media = typeof matchMedia === "function" ? matchMedia(DARK_SCHEME_QUERY) : null;

  media?.addEventListener("change", update);
  doc.defaultView?.addEventListener("load", update, { once: true });

  const interval = setInterval(update, RECHECK_MS);

  signal.addEventListener("abort", () => {
    observer.disconnect();
    clearTimeout(scheduled);
    clearInterval(interval);
    media?.removeEventListener("change", update);
  }, { once: true });

  update();

  return update;
}
