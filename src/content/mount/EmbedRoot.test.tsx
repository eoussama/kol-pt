import type { TEntry } from "../../core/schemas/entry/entry.schema";
import type { TPost } from "../../core/schemas/post.schema";
import type { ICardEmbed } from "./card-registry";

import { act, render, screen, waitFor } from "@testing-library/react";
import { hydratePosts } from "../../core/domain/hydrate";
import { EEntryType } from "../../core/enums/entry-type.enum";
import { request } from "../../core/messaging/client";
import { useAuthStore } from "../../state/auth.state";
import { CardRegistry } from "./card-registry";
import { EmbedRoot } from "./EmbedRoot";



vi.mock("../../core/messaging/client", () => ({ request: vi.fn() }));

const entries: Array<TEntry> = [{ id: "e1", type: EEntryType.MOVIE, title: "Heat", altTitles: [] }];
const model: TPost = {
  id: "p1",
  title: "Stream",
  description: "",
  thumbnail: "",
  creationDate: 1000,
  tags: [{ id: "t1", entryId: "e1", label: "Part 1", description: "", startTime: 10, endTime: 70, context: {} }],
};

/**
 * @description
 * Mounts the root and a card for a panel to render into.
 *
 * @returns The registry, the card, its host and a way to register a panel for it
 */
function setup() {
  const registry = new CardRegistry();
  const card = document.createElement("div");
  const host = document.createElement("div");

  card.append(host);
  document.body.append(card);

  // The root container is detached, like in the content script
  render(<EmbedRoot registry={registry} />, { container: document.createElement("div") });

  const mount = (embed: Partial<ICardEmbed>) => act(() => registry.set({ key: "1001-1", card, host, postId: "1001", post: null, untracked: false, ...embed }));

  return { registry, card, host, mount };
}

beforeEach(() => {
  vi.mocked(request).mockReset().mockResolvedValue(undefined as never);
});

afterEach(() => {
  useAuthStore.setState({ user: null, moderator: false, ready: false });
  document.body.replaceChildren();
});

describe("embedRoot", () => {
  it("renders each panel inside its card", () => {
    const { registry, card, host, mount } = setup();

    mount({});

    // Inside the host's shadow root, apart from the page's styles
    expect(host.shadowRoot?.textContent).toContain("Loading post info...");

    act(() => registry.delete(card));

    expect(host.shadowRoot?.querySelector("[data-kol-pt-container]")?.textContent).toBe("");
  });

  it("shows the reactions of a tracked post", async () => {
    const { host, mount } = setup();
    const [post] = hydratePosts([model], entries);

    mount({ post });

    await waitFor(() => expect(host.shadowRoot?.textContent).toContain("1 reaction"));
    expect(host.shadowRoot?.textContent).not.toContain("Loading post info...");
  });

  it("offers to track an untracked post to a signed-in user", () => {
    const { host, mount } = setup();

    useAuthStore.setState({ user: { uid: "u1", email: null, displayName: null, photoURL: null }, ready: true });
    mount({ untracked: true });

    expect(host.shadowRoot?.textContent).toContain("KOL PT does not track this post yet.");
    expect(host.shadowRoot?.textContent).not.toContain("Loading post info...");
  });

  it("prefers the tracked post to the untracked notice", async () => {
    const { host, mount } = setup();
    const [post] = hydratePosts([model], entries);

    useAuthStore.setState({ user: { uid: "u1", email: null, displayName: null, photoURL: null }, ready: true });
    mount({ post, untracked: true });

    await waitFor(() => expect(host.shadowRoot?.textContent).toContain("1 reaction"));
    expect(host.shadowRoot?.textContent).not.toContain("does not track this post yet");
    expect(screen.queryByText("does not track")).toBeNull();
  });
});
