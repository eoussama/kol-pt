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
