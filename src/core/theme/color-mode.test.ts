import { applyThemeClass, DARK_SCHEME_QUERY, isDarkColor, isSystemDark, resolveThemeMode, toPatreonColorMode } from "./color-mode";



describe("resolveThemeMode", () => {
  it.each([
    ["light", false, "light"],
    ["light", true, "light"],
    ["dark", false, "dark"],
    ["dark", true, "dark"],
    ["auto", true, "dark"],
    ["auto", false, "light"],
    ["inverted", false, "dark"],
    ["inverted", true, "light"],
    [null, true, "dark"],
  ] as const)("patreon %s with a dark system %s gives %s", (setting, systemDark, expected) => {
    expect(resolveThemeMode(setting, systemDark)).toBe(expected);
  });
});

describe("toPatreonColorMode", () => {
  it.each([["dark", "dark"], ["light", "light"], ["inverted", "inverted"], ["auto", "auto"], [null, "auto"], ["sepia", "auto"]])("reads %s as %s", (value, expected) => {
    expect(toPatreonColorMode(value)).toBe(expected);
  });
});

describe("isDarkColor", () => {
  it.each([
    ["#1c1c1c", true],
    ["#121212", true],
    ["#fff", false],
    ["#ffffff", false],
    ["#f9f9f9", false],
    ["#00000017", true],
    ["rgb(28, 28, 28)", true],
    ["rgba(255, 255, 255, 0.5)", false],
    [" #272727 ", true],
    ["#000", true],
    ["#222", true],
    ["#eee", false],
    ["#0008", true],
    ["#ffff", false],
    ["#FFFFFF", false],
    ["rgb(0 0 0)", true],
    ["rgb( 0, 0, 0)", true],
    ["rgba(0,0,0,0.5)", true],
    ["rgb(255, 255, 255)", false],
    ["rgb(0, 190, 255)", false],
    ["rgb(10.5, 20.5, 30.5)", true],
  ])("%s is dark: %s", (color, expected) => {
    expect(isDarkColor(color)).toBe(expected);
  });

  it("tells dark from light at the luminance threshold, weighing each channel", () => {
    // Relative luminance: 0.2126 * r + 0.7152 * g + 0.0722 * b, dark below 0.4
    expect(isDarkColor("#00ff00")).toBe(false);
    expect(isDarkColor("#ff0000")).toBe(true);
    expect(isDarkColor("#0000ff")).toBe(true);
    expect(isDarkColor("#ff00ff")).toBe(true);
    expect(isDarkColor("#ffff00")).toBe(false);
    expect(isDarkColor("#00ffff")).toBe(false);
    expect(isDarkColor("#00c8ff")).toBe(false);
    expect(isDarkColor("#808080")).toBe(true);
    expect(isDarkColor("#a9a9a9")).toBe(true);
    expect(isDarkColor("#aaaaaa")).toBe(false);
  });

  it("reads dim colors with the linear part of the sRGB curve", () => {
    // 10/255 sits under the 0.03928 cutoff, where lightness is linear
    expect(isDarkColor("#0a0a0a")).toBe(true);
    expect(isDarkColor("#090909")).toBe(true);
  });

  it("does not read colors that only contain one", () => {
    expect(isDarkColor("not #fff")).toBeNull();
    expect(isDarkColor("#fff not")).toBeNull();
    expect(isDarkColor("#ffff0")).toBeNull();
    expect(isDarkColor("#ggg")).toBeNull();
    expect(isDarkColor("color-mix(rgb(0, 0, 0), white)")).toBeNull();
    expect(isDarkColor("rgb(a, b, c)")).toBeNull();
    expect(isDarkColor("rgb(0, 0)")).toBeNull();
    expect(isDarkColor("rgb(0, 0, x)")).toBeNull();
  });

  it("cannot read named or var() colors", () => {
    expect(isDarkColor("white")).toBeNull();
    expect(isDarkColor("var(--x)")).toBeNull();
  });
});

describe("applyThemeClass", () => {
  it("marks the document dark, and unmarks it for light", () => {
    applyThemeClass("dark");
    expect(document.documentElement).toHaveClass("dark");

    applyThemeClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("marks only the element given", () => {
    const panel = document.createElement("div");

    applyThemeClass("dark", panel);

    expect(panel).toHaveClass("dark");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("does not touch the page when nothing changes", () => {
    const changes = vi.fn();
    const observer = new MutationObserver(changes);

    applyThemeClass("dark");
    observer.observe(document.documentElement, { attributes: true });
    applyThemeClass("dark");

    expect(observer.takeRecords()).toEqual([]);
    observer.disconnect();
    applyThemeClass("light");
  });
});

describe("isSystemDark", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([true, false])("follows the dark scheme query when it matches: %s", (matches) => {
    const matchMedia = vi.fn().mockReturnValue({ matches });

    vi.stubGlobal("matchMedia", matchMedia);

    expect(isSystemDark()).toBe(matches);
    expect(matchMedia).toHaveBeenCalledWith(DARK_SCHEME_QUERY);
    expect(DARK_SCHEME_QUERY).toBe("(prefers-color-scheme: dark)");
  });

  it("counts as light where media queries are unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);

    expect(isSystemDark()).toBe(false);
  });
});
