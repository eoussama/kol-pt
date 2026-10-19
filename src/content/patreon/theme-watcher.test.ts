import { measurePatreonMode, watchPatreonTheme } from "./theme-watcher";



describe("watchPatreonTheme", () => {
  let controller: AbortController;

  beforeEach(() => {
    controller = new AbortController();
    document.documentElement.setAttribute("data-token-color-mode", "light");
    document.body.innerHTML = "<div data-tag=\"post-card\"></div>";
  });

  afterEach(() => {
    vi.useRealTimers();
    controller.abort();
  });

  it("follows Patreon's appearance setting", async () => {
    const onChange = vi.fn();

    watchPatreonTheme({ onChange, signal: controller.signal });
    expect(onChange).toHaveBeenLastCalledWith("light", "light");

    document.documentElement.setAttribute("data-token-color-mode", "dark");
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(onChange).toHaveBeenLastCalledWith("dark", "dark");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("trusts what the page renders over its setting", () => {
    const onChange = vi.fn();
    const card = document.querySelector<HTMLElement>("[data-tag=\"post-card\"]") as HTMLElement;

    // The setting says light, but the posts are rendered with dark tokens
    card.style.setProperty("--global-bg-base-default", "#1c1c1c");
    watchPatreonTheme({ onChange, signal: controller.signal });

    expect(onChange).toHaveBeenLastCalledWith("dark", "dark");
  });

  it("notices a theme switched on a container deep in the page", () => {
    vi.useFakeTimers();

    const onChange = vi.fn();

    document.body.innerHTML = "<div id=\"c\"><main><div data-tag=\"post-card\"></div></main></div>";
    watchPatreonTheme({ onChange, signal: controller.signal });
    expect(onChange).toHaveBeenLastCalledWith("light", "light");

    (document.getElementById("c") as HTMLElement).style.backgroundColor = "rgb(18, 18, 18)";
    vi.advanceTimersByTime(2100);

    expect(onChange).toHaveBeenLastCalledWith("dark", "dark");
  });

  it("checks again on request and stops when aborted", async () => {
    const onChange = vi.fn();
    const card = document.querySelector<HTMLElement>("[data-tag=\"post-card\"]") as HTMLElement;
    const refresh = watchPatreonTheme({ onChange, signal: controller.signal });

    card.style.setProperty("--global-bg-base-default", "#1c1c1c");
    refresh();
    expect(onChange).toHaveBeenLastCalledWith("dark", "dark");

    controller.abort();
    document.documentElement.setAttribute("data-token-color-mode", "light");
    card.style.setProperty("--global-bg-base-default", "#ffffff");
    refresh();
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe("measurePatreonMode", () => {
  it("reads the background the posts sit on", () => {
    document.body.innerHTML = "<main style=\"background-color: rgb(18, 18, 18)\"><div data-tag=\"post-card\"></div></main>";
    expect(measurePatreonMode()).toBe("dark");

    document.body.innerHTML = "<main style=\"background-color: rgb(255, 255, 255)\"><div data-tag=\"post-card\"></div></main>";
    expect(measurePatreonMode()).toBe("light");
  });

  it("is unknown without Patreon's tokens", () => {
    document.body.innerHTML = "<div data-tag=\"post-card\"></div>";

    expect(measurePatreonMode()).toBeNull();
  });
});

describe("measurePatreonMode with colors it cannot read", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips a background that is not an rgb() color and uses the next one", () => {
    document.body.innerHTML = "<main style=\"background-color: rgb(18, 18, 18)\"><div style=\"background-color: oklch(0.9 0 0)\"><div data-tag=\"post-card\"></div></div></main>";

    expect(measurePatreonMode()).toBe("dark");
  });

  it("skips a mostly transparent background", () => {
    document.body.innerHTML = "<main style=\"background-color: rgb(18, 18, 18)\"><div style=\"background-color: rgba(255, 255, 255, 0.5)\"><div data-tag=\"post-card\"></div></div></main>";

    expect(measurePatreonMode()).toBe("dark");
  });

  it("takes a background that is nearly opaque", () => {
    document.body.innerHTML = "<main style=\"background-color: rgb(18, 18, 18)\"><div style=\"background-color: rgba(255, 255, 255, 0.9)\"><div data-tag=\"post-card\"></div></div></main>";

    expect(measurePatreonMode()).toBe("light");
  });

  it.each([
    ["rgb(255 255 255 / 40%)", "dark"],
    ["rgb(255 255 255 / 95%)", "light"],
    ["rgb(255 255 255 / 0.95)", "light"],
    ["rgb(255 255 255)", "light"],
  ])("reads the opacity in %s", (color, expected) => {
    document.body.innerHTML = "<main><div id=\"top\"><div data-tag=\"post-card\"></div></div></main>";

    const backgrounds: Record<string, string> = { top: color, main: "rgb(18, 18, 18)" };

    vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => ({
      backgroundColor: backgrounds[element.id || element.tagName.toLowerCase()] ?? "rgba(0, 0, 0, 0)",
      getPropertyValue: () => "",
    }) as unknown as CSSStyleDeclaration);

    expect(measurePatreonMode()).toBe(expected);
  });

  it("is unknown when the surface token is not a color", () => {
    document.body.innerHTML = "<div data-tag=\"post-card\" style=\"--global-bg-base-default: var(--elsewhere)\"></div>";

    expect(measurePatreonMode()).toBeNull();
  });
});

describe("measurePatreonMode where there is no card", () => {
  it("falls back to the main content, then to the body", () => {
    document.body.innerHTML = "<main id=\"main-content\" style=\"background-color: rgb(18, 18, 18)\"></main>";
    expect(measurePatreonMode()).toBe("dark");

    document.body.innerHTML = "";
    document.body.style.backgroundColor = "rgb(255, 255, 255)";
    expect(measurePatreonMode()).toBe("light");

    document.body.removeAttribute("style");
  });

  it("is unknown when the page has no body to look at", () => {
    const doc = document.implementation.createHTMLDocument("empty");

    doc.body.remove();

    expect(measurePatreonMode(doc)).toBeNull();
  });
});

describe("measurePatreonMode from the surface token", () => {
  it("reads a light token", () => {
    document.body.innerHTML = "<div data-tag=\"post-card\" style=\"--global-bg-base-default: #ffffff\"></div>";

    expect(measurePatreonMode()).toBe("light");
  });
});

describe("watchPatreonTheme following the system appearance", () => {
  const listeners = new Set<() => void>();
  let systemDark = false;
  let controller: AbortController;

  beforeEach(() => {
    systemDark = false;
    listeners.clear();
    controller = new AbortController();
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      get matches() {
        return systemDark;
      },
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    })));
    document.documentElement.setAttribute("data-token-color-mode", "auto");
    document.body.innerHTML = "<div data-tag=\"post-card\"></div>";
  });

  afterEach(() => {
    controller.abort();
    vi.unstubAllGlobals();
  });

  it("switches when the system does, until aborted", () => {
    const onChange = vi.fn();

    watchPatreonTheme({ onChange, signal: controller.signal });
    expect(onChange).toHaveBeenLastCalledWith("light", "auto");
    expect(listeners.size).toBe(1);

    systemDark = true;
    listeners.forEach(listener => listener());
    expect(onChange).toHaveBeenLastCalledWith("dark", "auto");

    controller.abort();
    expect(listeners.size).toBe(0);
  });
});
