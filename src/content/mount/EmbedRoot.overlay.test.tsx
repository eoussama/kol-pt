import { act, render } from "@testing-library/react";
import { usePortalContainer } from "../../components/ui/portal-container";
import { CardRegistry } from "./card-registry";
import { EmbedRoot } from "./EmbedRoot";



// A panel that reports where overlays would render
vi.mock("../../components/layout/embed/post-loader/PostLoader", () => ({
  default: () => <span>{`overlays: ${usePortalContainer()?.id ?? "body"}`}</span>,
}));

afterEach(() => {
  document.body.replaceChildren();
});

describe("embedRoot overlays", () => {
  it.each([
    ["into the overlay container", "overlay", "overlays: overlay"],
    ["into the body", undefined, "overlays: body"],
  ])("renders the panels' overlays %s", (_name, id, expected) => {
    const registry = new CardRegistry();
    const card = document.createElement("div");
    const host = document.createElement("div");
    const overlay = id ? Object.assign(document.createElement("div"), { id }) : undefined;

    card.append(host);
    document.body.append(card);
    render(<EmbedRoot registry={registry} overlayContainer={overlay} />, { container: document.createElement("div") });
    act(() => registry.set({ key: "1001-1", card, host, postId: "1001", post: null, untracked: false }));

    expect(host.shadowRoot?.textContent).toContain(expected);
  });
});
