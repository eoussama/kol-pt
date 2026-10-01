import { act, render } from "@testing-library/react";
import { CardRegistry } from "./card-registry";
import { EmbedRoot } from "./EmbedRoot";



describe("embedRoot", () => {
  it("renders each panel inside its card", () => {
    const registry = new CardRegistry();
    const card = document.createElement("div");
    const host = document.createElement("div");

    card.append(host);
    document.body.append(card);

    // The root container is detached, like in the content script
    render(<EmbedRoot registry={registry} />, { container: document.createElement("div") });

    act(() => registry.set({ key: "1001-1", card, host, postId: "1001", post: null }));

    expect(host.textContent).toContain("Loading post info...");

    act(() => registry.delete(card));

    expect(host.textContent).toBe("");
  });
});
