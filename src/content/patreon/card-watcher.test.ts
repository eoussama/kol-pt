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
