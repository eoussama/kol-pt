import type { TEntry } from "../../../core/schemas/entry/entry.schema";
import type { TPost } from "../../../core/schemas/post.schema";

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { EViewMode } from "../../../core/enums/view-mode.enum";
import { request } from "../../../core/messaging/client";
import { useAuthStore } from "../../../state/auth.state";
import { usePostStore } from "../../../state/posts.state";
import { useSettingsStore } from "../../../state/settings.state";
import FeedPage from "./FeedPage";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));

const user = { uid: "u1", email: null, displayName: null, photoURL: null };
const entries = [{ id: "e1", type: EEntryType.TV_SHOW, title: "Severance", altTitles: [] }] as Array<TEntry>;
const posts = [
  { id: "post-1", title: "Older Stream", description: "", thumbnail: "", creationDate: 1000, tags: [] },
  { id: "post-2", title: "Newer Stream", description: "Watching two shows", thumbnail: "", creationDate: 2000, tags: [{ id: "t1", entryId: "e1", label: "3", description: "", startTime: 0, endTime: 60, context: {} }] },
] as Array<TPost>;

/**
 * @description
 * Answers the background requests the page makes.
 *
 * @param list - The posts the background lists, or a promise standing in for them
 * @param saved - The view mode the signed-in user saved
 */
function answer(list: Promise<{ posts: Array<TPost>; entries: Array<TEntry> }> | { posts: Array<TPost>; entries: Array<TEntry> }, saved: number = EViewMode.EXPANDED): void {
  vi.mocked(request).mockImplementation((async (type: string) => type === "posts.list" ? list : { viewMode: saved }) as never);
}

describe("feedPage", () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
    usePostStore.setState({ posts: [], error: false, loading: false });
    useAuthStore.setState({ user: null, moderator: false });
    useSettingsStore.setState({ viewMode: EViewMode.EXPANDED });
  });

  it("shows three card placeholders while the posts load in the expanded view", async () => {
    answer(new Promise(() => undefined));

    render(<FeedPage />);

    const skeleton = await screen.findByLabelText("Loading posts");

    expect(skeleton.children).toHaveLength(3);
    expect(skeleton.querySelector("[class~=\"aspect-2/1\"]")).not.toBeNull();
  });

  it("shows six row placeholders while the posts load in the compact view", async () => {
    useSettingsStore.setState({ viewMode: EViewMode.COMPACT });
    answer(new Promise(() => undefined));

    render(<FeedPage />);

    const skeleton = await screen.findByLabelText("Loading posts");

    expect(skeleton.children).toHaveLength(6);
    expect(skeleton.querySelector("[class~=\"aspect-2/1\"]")).toBeNull();
  });

  it("lists the posts, newest first, with their reactions", async () => {
    answer({ posts, entries });

    render(<FeedPage />);

    const cards = await screen.findAllByRole("article");

    expect(cards.map(card => within(card).getByRole("button", { name: /Stream/ }).textContent)).toEqual(["Newer Stream", "Older Stream"]);
    expect(cards[0]).toHaveAttribute("data-view-mode", "expanded");
    expect(within(cards[0]!).getByText("Severance - 3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("filters the posts by the search", async () => {
    answer({ posts, entries });

    render(<FeedPage />);
    await screen.findAllByRole("article");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "SEVERANCE" } });

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("Newer Stream")).toBeInTheDocument();
  });

  it("says nothing matches the search", async () => {
    answer({ posts, entries });

    render(<FeedPage />);
    await screen.findAllByRole("article");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });

    expect(screen.getByText(/No posts match/)).toHaveTextContent("No posts match zzz");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("says there are no posts when none exist", async () => {
    answer({ posts: [], entries: [] });

    render(<FeedPage />);

    expect(await screen.findByText("No posts found")).toBeInTheDocument();
  });

  it("shows an error when the posts cannot be loaded", async () => {
    answer(Promise.reject(new Error("Offline")));

    render(<FeedPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load data");
  });

  it("switches the cards between the expanded and the compact view", async () => {
    answer({ posts, entries });

    render(<FeedPage />);
    await screen.findAllByRole("article");

    expect(screen.getByRole("button", { name: "expanded" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "compact" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "compact" }));

    expect(useSettingsStore.getState().viewMode).toBe(EViewMode.COMPACT);
    expect(screen.getAllByRole("article").map(card => card.getAttribute("data-view-mode"))).toEqual(["compact", "compact"]);
    expect(screen.getByRole("button", { name: "compact" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "expanded" }));

    expect(useSettingsStore.getState().viewMode).toBe(EViewMode.EXPANDED);
    expect(screen.getAllByRole("article").map(card => card.getAttribute("data-view-mode"))).toEqual(["expanded", "expanded"]);
    expect(request).not.toHaveBeenCalledWith("settings.set", expect.anything());
  });

  it("saves the view mode of a signed-in user, and shows the one they saved", async () => {
    useAuthStore.setState({ user });
    answer({ posts, entries }, EViewMode.COMPACT);

    render(<FeedPage />);

    await waitFor(() => expect(screen.getAllByRole("article")[0]).toHaveAttribute("data-view-mode", "compact"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "expanded" }));
    });

    expect(request).toHaveBeenCalledWith("settings.set", { settings: { viewMode: EViewMode.EXPANDED } });
  });
});
