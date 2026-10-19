import { act, renderHook, waitFor } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { patreonColorModeItem } from "../core/storage/items";
import { DARK_SCHEME_QUERY } from "../core/theme/color-mode";
import { useThemeStore } from "../state/theme.state";
import { usePopupTheme } from "./popup-theme.hook";



/**
 * @description
 * A stand-in for the system's appearance, which tests can switch.
 */
const system = {
  dark: false,
  listeners: new Set<() => void>(),
  query: "",
};

/**
 * @description
 * Switches the system's appearance, as the user would in their settings.
 *
 * @param dark - Whether it is dark now
 */
function setSystemDark(dark: boolean): void {
  system.dark = dark;
  system.listeners.forEach(listener => listener());
}

/**
 * @description
 * Lets pending storage events settle.
 *
 * @returns A promise resolving once they have
 */
const settle = () => new Promise(resolve => setTimeout(resolve, 20));

describe("usePopupTheme", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
    system.dark = false;
    system.listeners.clear();
    vi.stubGlobal("matchMedia", (query: string) => {
      system.query = query;

      return {
        get matches() { return system.dark; },
        addEventListener: (_: string, listener: () => void) => system.listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => system.listeners.delete(listener),
      };
    });
    document.documentElement.classList.remove("dark");
    useThemeStore.setState({ mode: "light" });
    await patreonColorModeItem.removeValue();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the system until Patreon has been visited", async () => {
    setSystemDark(true);

    renderHook(() => usePopupTheme());

    await waitFor(() => expect(useThemeStore.getState().mode).toBe("dark"));
    expect(document.documentElement).toHaveClass("dark");
    expect(system.query).toBe(DARK_SCHEME_QUERY);
  });

  it("is light with a light system", async () => {
    renderHook(() => usePopupTheme());
    await settle();

    expect(useThemeStore.getState().mode).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("matches the appearance last seen on Patreon, whatever the system", async () => {
    await patreonColorModeItem.setValue("dark");

    renderHook(() => usePopupTheme());

    await waitFor(() => expect(useThemeStore.getState().mode).toBe("dark"));
    expect(document.documentElement).toHaveClass("dark");
  });

  it("inverts the system when Patreon does", async () => {
    await patreonColorModeItem.setValue("inverted");

    renderHook(() => usePopupTheme());

    await waitFor(() => expect(useThemeStore.getState().mode).toBe("dark"));

    act(() => setSystemDark(true));
    expect(useThemeStore.getState().mode).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("follows Patreon as its appearance changes", async () => {
    renderHook(() => usePopupTheme());
    await settle();

    await patreonColorModeItem.setValue("dark");
    await waitFor(() => expect(useThemeStore.getState().mode).toBe("dark"));

    await patreonColorModeItem.setValue("light");
    await waitFor(() => expect(useThemeStore.getState().mode).toBe("light"));
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("follows the system as its appearance changes", async () => {
    renderHook(() => usePopupTheme());
    await settle();

    act(() => setSystemDark(true));
    expect(useThemeStore.getState().mode).toBe("dark");

    act(() => setSystemDark(false));
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("stops following anything once unmounted", async () => {
    const { unmount } = renderHook(() => usePopupTheme());

    await settle();
    unmount();

    expect(system.listeners.size).toBe(0);

    await patreonColorModeItem.setValue("dark");
    await settle();
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("follows the system when Patreon's appearance cannot be read", async () => {
    setSystemDark(true);
    vi.spyOn(patreonColorModeItem, "getValue").mockRejectedValue(new Error("unreadable"));

    renderHook(() => usePopupTheme());
    await settle();

    expect(useThemeStore.getState().mode).toBe("dark");
  });
});
