import { applyThemeClass, DARK_SCHEME_QUERY, isDarkColor, isSystemDark, resolveThemeMode, toPatreonColorMode } from "./color-mode";



describe("resolveThemeMode", () => {
  it.each([
    ["light", false, "light"],
    ["light", true, "light"],
    ["dark", false, "dark"],
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
  ])("%s is dark: %s", (color, expected) => {
    expect(isDarkColor(color)).toBe(expected);
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
  });

  it("counts as light where media queries are unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);

    expect(isSystemDark()).toBe(false);
  });
});
