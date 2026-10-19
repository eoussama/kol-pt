import type { TEntry } from "../../../core/schemas/entry/entry.schema";
import type { TPost } from "../../../core/schemas/post.schema";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import { useAuthStore } from "../../../state/auth.state";
import { useFavoritesStore } from "../../../state/favorites.state";
import { usePostStore } from "../../../state/posts.state";
import { useProgressStore } from "../../../state/progress.state";
import { useWatchlistStore } from "../../../state/watchlist.state";
import HistoryPage from "./HistoryPage";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));

const user = { uid: "u1", email: null, displayName: null, photoURL: null };
const entries = [{ id: "e1", type: EEntryType.ANIME, title: "Frieren", altTitles: [] }] as Array<TEntry>;

/**
 * @description
 * Builds a reaction.
 *
 * @param id - The reaction's ID
 * @param entryId - The entry it is about
 * @param label - Its label
 * @param startTime - When it starts, in seconds
 * @param endTime - When it ends, in seconds
 * @returns The reaction
 */
function tag(id: string, entryId: string, label: string, startTime: number, endTime: number) {
  return { id, entryId, label, description: "", startTime, endTime, context: {} };
}

const posts = [
  { id: "post-1", title: "Old Stream", description: "", thumbnail: "https://example.com/old.png", creationDate: 1000, tags: [tag("t1", "e1", "4", 0, 600), tag("t2", "ghost", "Mystery clip", 700, 4300)] },
  { id: "post-2", title: "New Stream", description: "", thumbnail: "https://example.com/new.png", creationDate: 2000, tags: [tag("t3", "e1", "5", 0, 100)] },
] as Array<TPost>;

const watchedAt = new Date(2024, 0, 2, 10, 30).getTime();
const favoritedAt = new Date(2024, 2, 4, 18, 45).getTime();
const savedAt = new Date(2024, 4, 6, 8, 15).getTime();

/**
 * @description
 * How a date is shown on a row.
 *
 * @param time - The time, in epoch milliseconds
 * @returns The date and time of day
 */
function shown(time: number): string {
  return `${new Date(time).toLocaleDateString()} at ${new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * @description
 * Opens the filter and picks one.
 *
 * @param name - The filter's label
 * @returns Resolves once the filter is applied
 */
async function pickFilter(name: string): Promise<void> {
  fireEvent.click(screen.getByRole("combobox", { name: "Show" }));

  const option = await screen.findByRole("option", { name });

  fireEvent.pointerDown(option);
  fireEvent.mouseDown(option);
  fireEvent.pointerUp(option);
  fireEvent.mouseUp(option);
  fireEvent.click(option);
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Show" })).toHaveTextContent(name));
}

describe("historyPage", () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
    vi.mocked(request).mockResolvedValue({ posts, entries } as never);
    vi.spyOn(window, "open").mockReturnValue(null);
    usePostStore.setState({ posts: [], error: false, loading: false });
    useAuthStore.setState({ user });
    useWatchlistStore.getState().setKeys(["post-1/t1", "post-1/t2", "post-2/t3"], { "post-1/t1": watchedAt, "post-1/t2": watchedAt + 1000 });
    useFavoritesStore.getState().setKeys(["post-2/t3"], { "post-2/t3": favoritedAt });
    useProgressStore.getState().setPosts({ "post-1": { time: 100, updatedAt: savedAt } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks to log in when nobody is signed in, even with watched reactions", async () => {
    useAuthStore.setState({ user: null });

    render(<HistoryPage />);

    expect(await screen.findByText("Login to keep a history of the reactions you watch and favorite")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Loading history")).not.toBeInTheDocument();
  });

  it("does not show the error to someone who is not signed in", async () => {
    useAuthStore.setState({ user: null });
    vi.mocked(request).mockRejectedValue(new Error("Offline"));

    render(<HistoryPage />);

    expect(await screen.findByText(/Login to keep a history/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a skeleton while the posts load", async () => {
    vi.mocked(request).mockReturnValue(new Promise(() => undefined) as never);

    render(<HistoryPage />);

    expect(await screen.findByLabelText("Loading history")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Loading history").children).toHaveLength(6);
  });

  it("shows an error when the posts cannot be loaded", async () => {
    vi.mocked(request).mockRejectedValue(new Error("Offline"));

    render(<HistoryPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load data");
  });

  it("lists the watched reactions, most recently watched first", async () => {
    render(<HistoryPage />);

    const rows = await screen.findAllByRole("listitem");

    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent(`Mystery clipMystery clip · Old StreamWatched ${shown(watchedAt + 1000)}`);
    expect(rows[1]).toHaveTextContent(`FrierenAnime — Episode 4 · Old StreamWatched ${shown(watchedAt)}`);
    expect(rows[2]).toHaveTextContent("FrierenAnime — Episode 5 · New StreamWatched");
    expect(rows[2]).not.toHaveTextContent("Watched ");
    expect(rows[2]!.querySelector("span.tabular-nums")!.textContent).toBe("Watched");
    expect(within(rows[1]!).getByRole("presentation")).toHaveAttribute("src", "https://example.com/old.png");
    expect(rows[1]!.querySelector("[aria-hidden=true]")).toBeNull();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("lists the favorites", async () => {
    render(<HistoryPage />);
    await screen.findAllByRole("listitem");
    await pickFilter("Favorites");

    const rows = screen.getAllByRole("listitem");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent(`FrierenAnime — Episode 5 · New StreamFavorited ${shown(favoritedAt)}`);
  });

  it("says there are no favorites when none exist", async () => {
    useFavoritesStore.getState().setKeys([]);

    render(<HistoryPage />);
    await screen.findAllByRole("listitem");
    await pickFilter("Favorites");

    expect(screen.getByText("Reactions you favorite will show up here")).toBeInTheDocument();
  });

  it("lists the posts to continue with how much is left and how far along they are", async () => {
    render(<HistoryPage />);
    await screen.findAllByRole("listitem");
    await pickFilter("Continue");

    const row = screen.getByRole("listitem");

    expect(row).toHaveTextContent(`FrierenAnime — Episode 4 · Old Stream8m left in this reaction · 1h 10m in the post · ${shown(savedAt)}`);
    expect(row.querySelector("[aria-hidden=true] > span")).toHaveStyle({ width: "2.3255813953488373%" });
  });

  it("says there is nothing to continue when no position is saved", async () => {
    useProgressStore.getState().setPosts({});

    render(<HistoryPage />);
    await screen.findAllByRole("listitem");
    await pickFilter("Continue");

    expect(screen.getByText("Posts you stop watching partway will show up here")).toBeInTheDocument();
  });

  it("says a post is finished once nothing is left of it", async () => {
    useProgressStore.getState().setPosts({ "post-2": { time: 500, updatedAt: savedAt } });

    render(<HistoryPage />);
    await screen.findAllByRole("listitem");
    await pickFilter("Continue");

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent(`Finished · ${shown(savedAt)}`);
  });

  it("names what each filter counts", async () => {
    render(<HistoryPage />);
    await screen.findAllByRole("listitem");

    expect(screen.getByRole("combobox", { name: "Show" })).toHaveTextContent("Watched");

    fireEvent.focus(screen.getByText("3"));
    expect(await screen.findByText("Watched Reactions")).toBeInTheDocument();

    await pickFilter("Favorites");

    fireEvent.focus(screen.getByText("1"));
    expect(await screen.findByText("Favorite Reactions")).toBeInTheDocument();

    await pickFilter("Continue");

    expect(screen.getByRole("combobox", { name: "Show" })).toHaveTextContent("Continue");

    fireEvent.focus(screen.getByText("1"));
    expect(await screen.findByText("Posts to Continue")).toBeInTheDocument();
  });

  it("keys each row by its post and reaction", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<HistoryPage />);
    await screen.findAllByRole("listitem");

    expect(error).not.toHaveBeenCalled();
  });

  it("filters the history by the search", async () => {
    render(<HistoryPage />);
    await screen.findAllByRole("listitem");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "NEW stream" } });

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("Episode 5 · New Stream");
  });

  it("says nothing matches the search", async () => {
    render(<HistoryPage />);
    await screen.findAllByRole("listitem");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });

    expect(screen.getByText(/No reactions match/)).toHaveTextContent("No reactions match zzz");
  });

  it("says nothing was watched yet", async () => {
    useWatchlistStore.getState().setKeys([]);

    render(<HistoryPage />);

    expect(await screen.findByText("Reactions you watch will show up here")).toBeInTheDocument();
  });

  it("plays a watched reaction on Patreon", async () => {
    render(<HistoryPage />);
    fireEvent.click(await screen.findByRole("button", { name: /Episode 4/ }));

    const url = new URL(vi.mocked(window.open).mock.calls[0]![0] as string);

    expect(url.pathname).toBe("/posts/post-1");
    expect(url.searchParams.get("reactionId")).toBe("t1");
    expect(url.searchParams.has("resumeAt")).toBe(false);
    expect(window.open).toHaveBeenCalledWith(url.href, "_blank", "noopener,noreferrer");
  });

  it("resumes a post to continue where it was left", async () => {
    render(<HistoryPage />);
    await screen.findAllByRole("listitem");
    await pickFilter("Continue");
    fireEvent.click(screen.getByRole("button", { name: /Episode 4/ }));

    const url = new URL(vi.mocked(window.open).mock.calls[0]![0] as string);

    expect(url.pathname).toBe("/posts/post-1");
    expect(url.searchParams.get("resumeAt")).toBe("100");
    expect(url.searchParams.has("reactionId")).toBe(false);
  });
});
