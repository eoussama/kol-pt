import { createOverlayContainer, getShadowContainer } from "./shadow";



/**
 * @description
 * Lets the page's mutation observers run.
 *
 * @returns Promise that resolves once they have
 */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

afterEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
});

describe("getShadowContainer", () => {
  it("renders into a styled shadow root, created once", () => {
    const host = document.createElement("div");
    const container = getShadowContainer(host);

    expect(host.shadowRoot?.contains(container)).toBe(true);
    expect(host.shadowRoot?.querySelector("style")).not.toBeNull();
    expect(getShadowContainer(host)).toBe(container);
    expect(container.getAttribute("data-kol-pt-container")).toBe("");
    expect(container.className).toBe("kolpt-root");
  });

  it("registers no properties on the page when the styles declare none", () => {
    getShadowContainer(document.createElement("div"));

    expect(document.getElementById("kol-pt-properties")?.parentElement).toBe(document.head);
    expect(document.getElementById("kol-pt-properties")?.textContent).toBe("");
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

  it.each([
    ["textarea", () => document.createElement("textarea")],
    ["select", () => document.createElement("select")],
    ["editable content", () => Object.defineProperty(document.createElement("div"), "isContentEditable", { value: true })],
  ])("keeps typing in %s from Patreon", (_name, create) => {
    const host = document.createElement("div");
    const field = create();
    const page = vi.fn();

    document.body.append(host);
    getShadowContainer(host).append(field);
    document.addEventListener("keyup", page);

    field.dispatchEvent(new KeyboardEvent("keyup", { key: "k", bubbles: true, composed: true }));

    expect(page).not.toHaveBeenCalled();
    document.removeEventListener("keyup", page);
  });

  it.each([
    ["a button", () => document.createElement("button")],
    ["an svg", () => document.createElementNS("http://www.w3.org/2000/svg", "svg")],
  ])("lets keys pressed on %s reach Patreon", (_name, create) => {
    const host = document.createElement("div");
    const target = create();
    const page = vi.fn();

    document.body.append(host);
    getShadowContainer(host).append(target);
    document.addEventListener("keydown", page);

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "k", bubbles: true, composed: true }));

    expect(page).toHaveBeenCalledTimes(1);
    document.removeEventListener("keydown", page);
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
    expect(host.getAttribute("data-kol-pt-overlays")).toBe("");
    expect((host as HTMLElement).style.position).toBe("relative");
    expect((host as HTMLElement).style.zIndex).toBe("2147483647");

    remove();
    await flush();

    expect(host.isConnected).toBe(false);
  });
});

describe("createOverlayContainer when the page changes", () => {
  it("leaves its host where it is while it is attached", async () => {
    const { container, remove } = createOverlayContainer();
    const host = (container.getRootNode() as ShadowRoot).host;
    const later = document.createElement("p");

    document.body.append(later);
    await flush();

    expect(document.body.lastElementChild).toBe(later);
    expect(host.parentElement).toBe(document.body);

    remove();
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
