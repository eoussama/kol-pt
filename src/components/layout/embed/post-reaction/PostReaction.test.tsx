import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ModerationContext } from "../../../../context/ModerationContext";
import { PostContext } from "../../../../context/PostContext";
import { ReactionOverlayContext } from "../../../../context/ReactionOverlayContext";
import { createEntry } from "../../../../core/domain/hydrate";
import { Tag } from "../../../../core/domain/tag";
import { EEntryType } from "../../../../core/enums/entry-type.enum";
import { useAuthStore } from "../../../../state/auth.state";
import { useFavoritesStore } from "../../../../state/favorites.state";
import { useReportsStore } from "../../../../state/reports.state";
import { useWatchlistStore } from "../../../../state/watchlist.state";
import PostReaction from "./PostReaction";



const player = { ready: true, playing: false, currentTime: 0, playFrom: vi.fn(), cue: vi.fn() };
const moderation = { report: vi.fn(), editTag: vi.fn(), deleteTag: vi.fn(), editPost: vi.fn(), untrackPost: vi.fn(), review: vi.fn() };
const signedIn = { uid: "u1", email: null, displayName: null, photoURL: null };
const anime = createEntry({ id: "e1", type: EEntryType.ANIME, title: "Frieren", malId: 52991 } as never);

vi.mock("../../../../content/player/PlayerProvider", () => ({ usePlayer: () => player }));

/**
 * @description
 * Builds a reaction.
 *
 * @param id - The reaction id and label
 * @param entry - What the reaction is about
 * @param times - When the reaction starts and ends, in seconds
 * @returns The reaction
 */
function tag(id: string, entry: typeof anime | null = null, times: [number, number] = [0, 60]): Tag {
  return new Tag({ id, entryId: "e1", label: id, description: "", startTime: times[0], endTime: times[1], context: {} }, entry);
}

/**
 * @description
 * Renders a reaction row in a post.
 *
 * @param postId - The post id
 * @param tagId - The reaction id
 * @param reaction - The reaction, when it is not a plain one
 * @returns The render result and the overlay state
 */
function renderRow(postId: string, tagId: string, reaction = tag(tagId)) {
  const overlay = { setTag: vi.fn(), setDialogOpened: vi.fn() };
  const view = render(
    <PostContext.Provider value={{ post: { id: postId } as never }}>
      <ReactionOverlayContext.Provider value={overlay as never}>
        <ModerationContext.Provider value={moderation}>
          <ul><PostReaction tag={reaction} /></ul>
        </ModerationContext.Provider>
      </ReactionOverlayContext.Provider>
    </PostContext.Provider>,
  );

  return { ...view, overlay };
}

describe("watched checkbox while saving", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { uid: "u1", email: null, displayName: null, photoURL: null } });
    useWatchlistStore.setState({ posts: new Map([["p1", new Set(["t3"])]]), saving: new Map() });
  });

  it("shows a loader for the reaction being saved and locks the rest of the post", () => {
    renderRow("p1", "t1");
    // The checkbox is an ARIA one: it is locked through aria-disabled
    expect(screen.getByRole("checkbox")).not.toHaveAttribute("aria-disabled", "true");

    act(() => useWatchlistStore.setState({ saving: new Map([["p1", "t1"]]) }));
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Saving" })).toBeInTheDocument();
  });

  it("locks the other reactions of that post, but not other posts", () => {
    const first = renderRow("p1", "t2");
    const other = renderRow("p2", "t1");

    act(() => useWatchlistStore.setState({ saving: new Map([["p1", "t1"]]) }));

    const [locked, free] = screen.getAllByRole("checkbox");

    expect(locked).toHaveAttribute("aria-disabled", "true");
    expect(free).not.toHaveAttribute("aria-disabled", "true");
    first.unmount();
    other.unmount();
  });

  it("shows the stored state of its own post", () => {
    renderRow("p1", "t3");

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("shows a heart that reflects, and saves, favorites", () => {
    const toggle = vi.fn(async () => true);

    useFavoritesStore.setState({ posts: new Map([["p1", new Set(["t3"])]]), markedAt: new Map(), saving: new Map(), toggle });

    const first = renderRow("p1", "t3");

    expect(screen.getByRole("button", { name: "remove from favorites" })).toHaveAttribute("aria-pressed", "true");
    first.unmount();

    renderRow("p1", "t1");
    screen.getByRole("button", { name: "add to favorites" }).click();

    expect(toggle).toHaveBeenCalledWith("p1", "t1", true);
  });

  it("shows a loader instead of the heart while a favorite is saved", () => {
    renderRow("p1", "t1");

    act(() => useFavoritesStore.setState({ saving: new Map([["p1", "t1"]]) }));

    expect(screen.queryByRole("button", { name: "add to favorites" })).not.toBeInTheDocument();
  });

  it("has no heart for signed-out users", () => {
    useAuthStore.setState({ user: null });
    renderRow("p1", "t1");

    expect(screen.queryByRole("button", { name: /favorites/ })).not.toBeInTheDocument();
  });
});

describe("reaction details", () => {
  beforeEach(() => {
    Object.assign(player, { ready: true, playing: false, currentTime: 0 });
    player.playFrom.mockClear();
    useAuthStore.setState({ user: null, moderator: false });
    useWatchlistStore.setState({ posts: new Map(), saving: new Map() });
    useFavoritesStore.setState({ posts: new Map(), markedAt: new Map(), saving: new Map() });
    useReportsStore.setState({ reports: [] });
  });

  it("shows the reaction's title, what it is about, when it starts and how long it lasts", () => {
    renderRow("p1", "3", tag("3", anime, [75, 140]));

    const row = screen.getByRole("listitem");

    expect(within(row).getByText("Frieren")).toBeInTheDocument();
    expect(row).toHaveTextContent("Anime · Episode 3");
    expect(within(row).getByRole("button", { name: "Play from 0:01:15" })).toHaveTextContent("0:01:15");
    expect(row).toHaveTextContent("1 minute 5 seconds");
  });

  it("shows only the label of a reaction without an entry", () => {
    renderRow("p1", "Mystery");

    const row = screen.getByRole("listitem");

    expect(within(row).getAllByText("Mystery")).toHaveLength(2);
    expect(row).not.toHaveTextContent("·  ");
    expect(row).not.toHaveTextContent("Anime");
  });

  it("plays from the start of the reaction", () => {
    renderRow("p1", "3", tag("3", anime, [75, 140]));

    fireEvent.click(screen.getByRole("button", { name: "Play from 0:01:15" }));
    expect(player.playFrom).toHaveBeenLastCalledWith(75);

    fireEvent.click(screen.getByRole("button", { name: "skip to reaction" }));
    expect(player.playFrom).toHaveBeenCalledTimes(2);
    expect(player.playFrom).toHaveBeenLastCalledWith(75);
  });

  it("opens the reaction's details, only for reactions with an entry", () => {
    const reaction = tag("3", anime);
    const { overlay, unmount } = renderRow("p1", "3", reaction);

    fireEvent.click(screen.getByRole("button", { name: "detail" }));

    expect(overlay.setTag).toHaveBeenCalledWith(reaction);
    expect(overlay.setDialogOpened).toHaveBeenCalledWith(true);
    unmount();

    renderRow("p1", "4");

    expect(screen.queryByRole("button", { name: "detail" })).not.toBeInTheDocument();
  });

  it("explains its buttons when hovering them", async () => {
    renderRow("p1", "3", tag("3", anime));

    fireEvent.focus(screen.getByRole("button", { name: "detail" }));

    expect(await screen.findByText("Detail")).toBeInTheDocument();
  });
});

describe("playback state", () => {
  beforeEach(() => {
    Object.assign(player, { ready: true, playing: false, currentTime: 0 });
    player.playFrom.mockClear();
    useAuthStore.setState({ user: null, moderator: false });
  });

  it("marks the reaction the playhead is in, playing or paused", () => {
    player.currentTime = 30;
    player.playing = true;

    const { unmount } = renderRow("p1", "3", tag("3", null, [10, 70]));
    const row = screen.getByRole("listitem");

    expect(row).toHaveAttribute("data-playing", "true");
    expect(within(row).getByText("Playing")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "restart reaction" })).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "skip to reaction" })).not.toBeInTheDocument();
    unmount();

    player.playing = false;
    renderRow("p1", "3", tag("3", null, [10, 70]));

    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.queryByText("Playing")).not.toBeInTheDocument();
  });

  it("restarts the reaction it is in", () => {
    player.currentTime = 30;
    renderRow("p1", "3", tag("3", null, [10, 70]));

    fireEvent.click(screen.getByRole("button", { name: "restart reaction" }));

    expect(player.playFrom).toHaveBeenCalledWith(10);
  });

  it.each([
    ["before it starts", [10, 70], 9],
    ["after it ends", [10, 70], 71],
    ["at the very beginning of the video", [0, 70], 0],
  ] as const)("is not playing %s", (_when, times, time) => {
    player.currentTime = time;
    renderRow("p1", "3", tag("3", null, [times[0], times[1]]));

    expect(screen.getByRole("listitem")).not.toHaveAttribute("data-playing");
    expect(screen.queryByText(/Playing|Paused/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "skip to reaction" })).toBeInTheDocument();
  });

  it.each([
    ["at its start", 10],
    ["at its end", 70],
  ])("is playing %s", (_when, time) => {
    player.currentTime = time;
    renderRow("p1", "3", tag("3", null, [10, 70]));

    expect(screen.getByRole("listitem")).toHaveAttribute("data-playing", "true");
  });
});

describe("watching and favoriting", () => {
  const toggleWatched = vi.fn(async () => true);
  const toggleFavorite = vi.fn(async () => true);

  beforeEach(() => {
    toggleWatched.mockClear();
    toggleFavorite.mockClear();
    useAuthStore.setState({ user: signedIn, moderator: false });
    useWatchlistStore.setState({ posts: new Map([["p1", new Set(["t1"])]]), saving: new Map(), toggle: toggleWatched });
    useFavoritesStore.setState({ posts: new Map(), markedAt: new Map(), saving: new Map(), toggle: toggleFavorite });
  });

  it("marks a reaction as watched, and as un-watched", () => {
    const { unmount } = renderRow("p1", "t2");

    fireEvent.click(screen.getByRole("checkbox", { name: "Mark as watched" }));
    expect(toggleWatched).toHaveBeenCalledWith("p1", "t2", true);
    unmount();

    renderRow("p1", "t1");

    expect(screen.getByRole("checkbox", { name: "Mark as un-watched" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Mark as un-watched" }));
    expect(toggleWatched).toHaveBeenLastCalledWith("p1", "t1", false);
  });

  it("dims the title of a watched reaction", () => {
    const { unmount } = renderRow("p1", "t1");

    expect(screen.getByText("t1", { selector: "span.truncate" })).toHaveClass("text-muted-foreground");
    unmount();

    renderRow("p1", "t2");

    expect(screen.getByText("t2", { selector: "span.truncate" })).not.toHaveClass("text-muted-foreground");
  });

  it("has no checkbox for signed-out users", () => {
    useAuthStore.setState({ user: null });
    renderRow("p1", "t2");

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("favorites a reaction, and removes it from the favorites", () => {
    const { unmount } = renderRow("p1", "t2");

    fireEvent.click(screen.getByRole("button", { name: "add to favorites" }));
    expect(toggleFavorite).toHaveBeenCalledWith("p1", "t2", true);
    unmount();

    useFavoritesStore.setState({ posts: new Map([["p1", new Set(["t2"])]]) });
    renderRow("p1", "t2");

    fireEvent.click(screen.getByRole("button", { name: "remove from favorites" }));
    expect(toggleFavorite).toHaveBeenLastCalledWith("p1", "t2", false);
  });

  it("keeps a favorite heart visible, and an unfavorited one for hovering", () => {
    const { unmount } = renderRow("p1", "t2");

    expect(screen.getByRole("button", { name: "add to favorites" }).parentElement).not.toHaveClass("opacity-100");
    unmount();

    useFavoritesStore.setState({ posts: new Map([["p1", new Set(["t2"])]]) });
    renderRow("p1", "t2");

    expect(screen.getByRole("button", { name: "remove from favorites" }).parentElement).toHaveClass("opacity-100");
  });

  it("locks the heart while a favorite of the post is saved", () => {
    useFavoritesStore.setState({ saving: new Map([["p1", "t9"]]) });
    renderRow("p1", "t2");

    expect(screen.getByRole("button", { name: "add to favorites" })).toBeDisabled();
  });
});

describe("more menu", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, moderator: false });
  });

  it("is there for a reaction with an entry, even when signed out", () => {
    renderRow("p1", "t1", tag("t1", anime));

    expect(screen.getByRole("button", { name: "more" })).toBeInTheDocument();
  });

  it("is there for signed-in users, to report a problem", () => {
    useAuthStore.setState({ user: signedIn });
    renderRow("p1", "t1");

    expect(screen.getByRole("button", { name: "more" })).toBeInTheDocument();
  });

  it("is not there for a signed-out viewer of a reaction without an entry", () => {
    renderRow("p1", "t1");

    expect(screen.queryByRole("button", { name: "more" })).not.toBeInTheDocument();
  });
});

describe("open reports", () => {
  /**
   * @description
   * Builds an open report.
   *
   * @param id - The report id
   * @param postId - The post it is about
   * @param tagId - The reaction it is about
   * @returns The report
   */
  function report(id: string, postId: string, tagId: string) {
    return { id, kind: "timestamp", postId, tagId, postTitle: "", note: "", reporterUid: "u2", reporterName: "", createdAt: 1 } as const;
  }

  beforeEach(() => {
    moderation.review.mockClear();
    useAuthStore.setState({ user: signedIn, moderator: true });
    useReportsStore.setState({ reports: [report("a", "p1", "t1"), report("b", "p1", "t1"), report("c", "p1", "t2"), report("d", "p2", "t1")] });
  });

  it("shows moderators how many are open for the reaction, and reviews them", () => {
    renderRow("p1", "t1");

    const badge = screen.getByRole("button", { name: "2 open reports" });

    expect(badge).toHaveTextContent("2");

    fireEvent.click(badge);

    expect(moderation.review).toHaveBeenCalledWith("t1");
  });

  it("counts only the reports of this reaction in this post", () => {
    renderRow("p1", "t2");

    expect(screen.getByRole("button", { name: "1 open reports" })).toBeInTheDocument();
  });

  it("shows nothing for a reaction without reports", () => {
    renderRow("p1", "t3");

    expect(screen.queryByRole("button", { name: /open reports/ })).not.toBeInTheDocument();
  });

  it("shows nothing to users who are not moderators", () => {
    useAuthStore.setState({ moderator: false });
    renderRow("p1", "t1");

    expect(screen.queryByRole("button", { name: /open reports/ })).not.toBeInTheDocument();
  });
});
