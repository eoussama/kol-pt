import { createOverlayContainer, getShadowContainer } from "./shadow";



/**
 * @description
 * Lets the page's mutation observers run.
 *
 * @returns Promise that resolves once they have
 */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

afterEach(() => {
  document.body.replaceChildren();
});

describe("getShadowContainer", () => {
  it("renders into a styled shadow root, created once", () => {
    const host = document.createElement("div");
    const container = getShadowContainer(host);

    expect(host.shadowRoot?.contains(container)).toBe(true);
    expect(host.shadowRoot?.querySelector("style")).not.toBeNull();
    expect(getShadowContainer(host)).toBe(container);
  });

  it("keeps the panels' clicks from Patreon", () => {
    const host = document.createElement("div");
    const button = document.createElement("button");
    const page = vi.fn();
    const panel = vi.fn();

    document.body.append(host);
    getShadowContainer(host).append(button);
    button.addEventListener("click", panel);
    document.addEventListener("click", page);

    button.click();

    expect(panel).toHaveBeenCalled();
    expect(page).not.toHaveBeenCalled();
    document.removeEventListener("click", page);
  });

  it("keeps typing from Patreon, but not Escape", () => {
    const host = document.createElement("div");
    const input = document.createElement("input");
    const keys: Array<string> = [];
    const onKey = (event: KeyboardEvent) => keys.push(event.key);

    document.body.append(host);
    getShadowContainer(host).append(input);
    document.addEventListener("keydown", onKey);

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "k", bubbles: true, composed: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));

    expect(keys).toEqual(["Escape"]);
    document.removeEventListener("keydown", onKey);
  });
});

describe("createOverlayContainer", () => {
  it("puts its host back when the page drops it", async () => {
    const { container, remove } = createOverlayContainer();
    const host = (container.getRootNode() as ShadowRoot).host;

    container.append(document.createElement("p"));
    host.remove();
    await flush();

    expect(host.isConnected).toBe(true);
    expect(container.querySelector("p")).not.toBeNull();

    remove();
    await flush();

    expect(host.isConnected).toBe(false);
  });
});

describe("createOverlayContainer in a document without a body", () => {
  it("attaches the host to the root element", () => {
    const doc = document.implementation.createHTMLDocument("empty");

    doc.body.remove();

    const { container, remove } = createOverlayContainer(doc);
    const host = (container.getRootNode() as ShadowRoot).host;

    expect(host.parentElement).toBe(doc.documentElement);

    remove();

    expect(host.isConnected).toBe(false);
  });
});
