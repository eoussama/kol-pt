import { watchCards } from "./card-watcher";
import { HOST_ATTRIBUTE } from "./selectors";



/**
 * @description
 * Lets queued MutationObserver callbacks run.
 *
 * @returns Promise that resolves after pending microtasks
 */
async function flushMutations(): Promise<void> {
  await Promise.resolve();
}

describe("watchCards", () => {
  let controller: AbortController;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "<main id=\"main-content\"></main>";
    controller = new AbortController();
  });

  afterEach(() => {
    controller.abort();
    vi.useRealTimers();
  });

  it("scans once immediately", () => {
    const onChange = vi.fn();

    watchCards({ onChange, signal: controller.signal });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("rescans once after a burst of page changes", async () => {
    const onChange = vi.fn();

    watchCards({ onChange, signal: controller.signal, debounceMs: 150 });
    onChange.mockClear();

    for (let i = 0; i < 5; i++) {
      document.body.append(document.createElement("div"));
      await flushMutations();
      vi.advanceTimersByTime(50);
    }

    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not wait longer than maxWait during continuous changes", async () => {
    const onChange = vi.fn();

    watchCards({ onChange, signal: controller.signal, debounceMs: 150, maxWaitMs: 400 });
    onChange.mockClear();

    for (let i = 0; i < 10; i++) {
      document.body.append(document.createElement("div"));
      await flushMutations();
      vi.advanceTimersByTime(100);
    }

    expect(onChange.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("ignores changes the extension makes", async () => {
    const onChange = vi.fn();

    watchCards({ onChange, signal: controller.signal });
    onChange.mockClear();

    const host = document.createElement("div");

    host.setAttribute(HOST_ATTRIBUTE, "");
    document.body.append(host);
    await flushMutations();
    host.append(document.createElement("span"));
    await flushMutations();
    vi.advanceTimersByTime(1000);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("rescans when a change deep in the page adds an element", async () => {
    const onChange = vi.fn();

    watchCards({ onChange, signal: controller.signal, debounceMs: 100 });
    onChange.mockClear();

    document.querySelector("main")?.append(document.createElement("div"));
    await flushMutations();
    vi.advanceTimersByTime(100);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("rescans when a panel and a page element are added together", async () => {
    const onChange = vi.fn();
    const host = document.createElement("div");

    host.setAttribute(HOST_ATTRIBUTE, "");
    watchCards({ onChange, signal: controller.signal, debounceMs: 100 });
    onChange.mockClear();

    document.body.append(host, document.createElement("div"));
    await flushMutations();
    vi.advanceTimersByTime(100);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("rescans when the page changes along with the extension's own panel", async () => {
    const onChange = vi.fn();
    const host = document.createElement("div");

    host.setAttribute(HOST_ATTRIBUTE, "");
    document.body.append(host);
    watchCards({ onChange, signal: controller.signal, debounceMs: 100 });
    onChange.mockClear();

    // Both land in one batch of mutations
    host.append(document.createElement("span"));
    document.body.append(document.createElement("div"));
    await flushMutations();
    vi.advanceTimersByTime(100);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("ignores text the page adds", async () => {
    const onChange = vi.fn();

    watchCards({ onChange, signal: controller.signal });
    onChange.mockClear();

    document.body.append("some text");
    await flushMutations();
    vi.advanceTimersByTime(1000);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not scan a change that was pending when it is aborted", async () => {
    const onChange = vi.fn();

    watchCards({ onChange, signal: controller.signal, debounceMs: 100 });
    onChange.mockClear();

    document.body.append(document.createElement("div"));
    await flushMutations();
    controller.abort();
    vi.advanceTimersByTime(1000);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("listens for the abort once", () => {
    const listen = vi.spyOn(controller.signal, "addEventListener");

    watchCards({ onChange: vi.fn(), signal: controller.signal });

    expect(listen).toHaveBeenCalledWith("abort", expect.any(Function), { once: true });
  });

  it("stops when aborted", async () => {
    const onChange = vi.fn();

    watchCards({ onChange, signal: controller.signal });
    onChange.mockClear();
    controller.abort();

    document.body.append(document.createElement("div"));
    await flushMutations();
    vi.advanceTimersByTime(1000);

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("watchCards with a signal that is already aborted", () => {
  it("does not scan or watch the page", async () => {
    vi.useFakeTimers();

    const onChange = vi.fn();
    const controller = new AbortController();

    controller.abort();
    watchCards({ onChange, signal: controller.signal });
    document.body.append(document.createElement("div"));
    await flushMutations();
    vi.advanceTimersByTime(2000);

    expect(onChange).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("watchCards on a root that is not an element", () => {
  it("rescans when nodes are added to it", async () => {
    vi.useFakeTimers();

    const onChange = vi.fn();
    const controller = new AbortController();
    const fragment = document.createDocumentFragment();

    watchCards({ onChange, signal: controller.signal, root: fragment, debounceMs: 100 });
    onChange.mockClear();

    fragment.append(document.createElement("div"));
    await flushMutations();
    vi.advanceTimersByTime(100);

    expect(onChange).toHaveBeenCalledTimes(1);

    controller.abort();
    vi.useRealTimers();
  });
});
