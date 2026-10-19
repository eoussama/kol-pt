import { getShadowContainer } from "./shadow";



// The compiled styles, with Tailwind's `@property` rules among the others
vi.mock("../../styles/embed.css?inline", () => ({
  default: [
    ".kolpt-root { color: red; }",
    "@property --tw-a {\n  syntax: \"*\";\n  inherits: false;\n}",
    ".other { margin: 0; }",
    "@property --tw-b {\n  syntax: \"<length>\";\n  inherits: false;\n  initial-value: 0;\n}",
  ].join("\n"),
}));

afterEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
});

describe("getShadowContainer properties", () => {
  it("copies the @property rules, and only them, onto the page", () => {
    const host = document.createElement("div");

    getShadowContainer(host);

    const style = document.getElementById("kol-pt-properties");

    expect(style?.parentElement).toBe(document.head);
    expect(style?.textContent).toBe([
      "@property --tw-a {\n  syntax: \"*\";\n  inherits: false;\n}",
      "@property --tw-b {\n  syntax: \"<length>\";\n  inherits: false;\n  initial-value: 0;\n}",
    ].join("\n"));
    expect(host.shadowRoot?.querySelector("style")?.textContent).toContain(".kolpt-root { color: red; }");
  });

  it("registers them once, however many panels there are", () => {
    getShadowContainer(document.createElement("div"));
    getShadowContainer(document.createElement("div"));

    expect(document.querySelectorAll("#kol-pt-properties")).toHaveLength(1);
  });
});
