import { applyThemeAttribute, isDarkColor, resolveThemeMode, toPatreonColorMode } from "./color-mode";



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

describe("applyThemeAttribute", () => {
  it("marks the document dark, and unmarks it for light", () => {
    applyThemeAttribute("dark");
    expect(document.documentElement.getAttribute("data-kolpt-theme")).toBe("dark");

    applyThemeAttribute("light");
    expect(document.documentElement.hasAttribute("data-kolpt-theme")).toBe(false);
  });

  it("does not touch the page when nothing changes", () => {
    const changes = vi.fn();
    const observer = new MutationObserver(changes);

    applyThemeAttribute("dark");
    observer.observe(document.documentElement, { attributes: true });
    applyThemeAttribute("dark");

    expect(observer.takeRecords()).toEqual([]);
    observer.disconnect();
    applyThemeAttribute("light");
  });
});
