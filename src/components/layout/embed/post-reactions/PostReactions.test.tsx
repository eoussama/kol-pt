import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PostContext } from "../../../../context/PostContext";
import { ReactionOverlayContext } from "../../../../context/ReactionOverlayContext";
import { createEntry } from "../../../../core/domain/hydrate";
import { Tag } from "../../../../core/domain/tag";
import { EEntryType } from "../../../../core/enums/entry-type.enum";
import { useAuthStore } from "../../../../state/auth.state";
import { useWatchlistStore } from "../../../../state/watchlist.state";
import PostReactions from "./PostReactions";



const player = { ready: false, playing: false, currentTime: 0, playFrom: vi.fn(), cue: vi.fn() };
const entryState = { loading: false, entry: null as unknown, photo: "", description: "", subscribers: 0, genres: [], altTitles: [], reactions: [] };
const useEntry = vi.fn((_entryId: string, _revision?: number) => entryState);

vi.mock("../../../../content/player/PlayerProvider", () => ({ usePlayer: () => player }));
const useAutoWatch = vi.fn();
const useProgressTracking = vi.fn();

vi.mock("../../../../hooks/auto-watch.hook", () => ({ useAutoWatch: (post: unknown) => useAutoWatch(post) }));
vi.mock("../../../../hooks/progress.hook", () => ({ useProgressTracking: (post: unknown) => useProgressTracking(post) }));
vi.mock("../../../../hooks/entry.hook", () => ({ useEntry: (entryId: string, revision?: number) => useEntry(entryId, revision) }));

const user = { uid: "u1", email: null, displayName: null, photoURL: null };
const anime = createEntry({ id: "e1", type: EEntryType.ANIME, title: "Frieren", malId: 52991 } as never);

/**
 * @description
 * Builds a reaction.
 *
 * @param id - The reaction's id and label
 * @param startTime - When it starts, in seconds
 * @param entry - What it is about
 * @returns The reaction
 */
function tag(id: string, startTime = 0, entry = null as typeof anime | null): Tag {
  return new Tag({ id, entryId: "e1", label: id, description: "", startTime, endTime: startTime + 60, context: {} }, entry);
}

/**
 * @description
 * Renders the panel.
 *
 * @param tags - The post's reactions
 * @param overlay - What to override in the reaction overlay's state
 * @returns The render result and the overlay's state
 */
function renderPanel(tags: Array<Tag> = [], overlay: Record<string, unknown> = {}) {
  const state = { tag: null, dialogOpened: false, setDialogOpened: vi.fn(), setTag: vi.fn(), ...overlay };
  const view = render(
    <PostContext.Provider value={{ post: { id: "p1", tags } as never }}>
      <ReactionOverlayContext.Provider value={state as never}>
        <PostReactions />
      </ReactionOverlayContext.Provider>
    </PostContext.Provider>,
  );

  return { ...view, state };
}

// The callout stays mounted while collapsed, hidden from view and from assistive technologies
const callout = () => screen.getByText(/in order to track your progress/);
const expectShown = () => waitFor(() => expect(callout()).toBeVisible());
const expectHidden = () => waitFor(() => expect(callout()).not.toBeVisible());

beforeEach(() => {
  Object.assign(player, { ready: false, playing: false, currentTime: 0 });
  player.playFrom.mockClear();
  player.cue.mockClear();
  useEntry.mockClear();
  useAutoWatch.mockClear();
  useProgressTracking.mockClear();
  window.history.replaceState({}, "", "/");
});

describe("empty reactions panel", () => {
  it("stays closed with no toggle", () => {
    renderPanel();

    const summary = screen.getByRole("button", { name: /0 reactions/ });

    expect(summary).toHaveAttribute("aria-expanded", "false");
    expect(summary).toBeDisabled();
    expect(summary.querySelector("svg.lucide-chevron-down")).toBeNull();

    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "false");
  });

  it("opens by itself once reactions are added", () => {
    const view = renderPanel();

    view.rerender(
      <PostContext.Provider value={{ post: { id: "p1", tags: [tag("a")] } as never }}>
        <ReactionOverlayContext.Provider value={view.state as never}>
          <PostReactions />
        </ReactionOverlayContext.Provider>
      </PostContext.Provider>,
    );

    expect(screen.getByRole("button", { name: /1 reaction/ })).toHaveAttribute("aria-expanded", "true");
  });
});

describe("reactions panel", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, ready: true });
    useWatchlistStore.setState({ posts: new Map([["p1", new Set(["a"])]]), saving: new Map() });
  });

  it("tracks the post's progress and watches it automatically", () => {
    const post = { id: "p1", tags: [tag("a")] };

    render(
      <PostContext.Provider value={{ post: post as never }}>
        <ReactionOverlayContext.Provider value={{ tag: null, dialogOpened: false, setDialogOpened: vi.fn(), setTag: vi.fn() } as never}>
          <PostReactions />
        </ReactionOverlayContext.Provider>
      </PostContext.Provider>,
    );

    expect(useAutoWatch).toHaveBeenCalledWith(post);
    expect(useProgressTracking).toHaveBeenCalledWith(post);
  });

  it("shows the Discord icon on the Passione button", () => {
    renderPanel();

    const icon = screen.getByRole("img", { name: "Discord icon" });

    expect(icon).toHaveAttribute("src", expect.stringContaining("/images/platforms/discord.png"));
  });

  it("counts the reactions, in the singular for one", () => {
    const { unmount } = renderPanel([tag("a")]);

    expect(screen.getByRole("button", { name: "1 reaction" })).toBeInTheDocument();
    unmount();

    renderPanel([tag("a"), tag("b")]);

    expect(screen.getByRole("button", { name: "2 reactions" })).toBeInTheDocument();
  });

  it("lists the reactions, earliest first as the post orders them", () => {
    renderPanel([tag("a", 10), tag("b", 70)]);

    expect(screen.getAllByRole("listitem").map(item => item.querySelector("span.truncate")?.textContent)).toEqual(["a", "b"]);
  });

  it("shows how many reactions a signed-in user watched, and nothing to signed-out users", () => {
    const { unmount } = renderPanel([tag("a"), tag("b")]);

    expect(screen.queryByText(/watched/)).not.toBeInTheDocument();
    unmount();

    useAuthStore.setState({ user });
    renderPanel([tag("a"), tag("b")]);

    expect(screen.getByText("1/2 watched")).toBeInTheDocument();
  });

  it("collapses and expands from its header", async () => {
    renderPanel([tag("a")]);

    const summary = screen.getByRole("button", { name: /1 reaction/ });

    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(summary.querySelector("svg.lucide-chevron-down")).not.toBeNull();

    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryAllByRole("listitem")).toHaveLength(0));

    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findAllByRole("listitem")).toHaveLength(1);
  });

  it("opens the Passione channel", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);

    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Opens KOl's Discord server" }));

    expect(open).toHaveBeenCalledWith("https://discord.com/channels/177656523135254529/823055567064530954", "_blank", "noopener,noreferrer");
    open.mockRestore();
  });
});

describe("positioning the video", () => {
  const tags = [tag("a", 10), tag("b", 70)];

  beforeEach(() => {
    player.ready = true;
  });

  it("jumps to the position in the link", () => {
    window.history.replaceState({}, "", "/?resumeAt=125");
    renderPanel(tags);

    expect(player.cue).toHaveBeenCalledTimes(1);
    expect(player.cue).toHaveBeenCalledWith(125);
  });

  it("jumps to the start of the reaction in the link", () => {
    window.history.replaceState({}, "", "/?reactionId=b");
    renderPanel(tags);

    expect(player.cue).toHaveBeenCalledTimes(1);
    expect(player.cue).toHaveBeenCalledWith(70);
  });

  it("prefers the position over the reaction", () => {
    window.history.replaceState({}, "", "/?resumeAt=5&reactionId=b");
    renderPanel(tags);

    expect(player.cue).toHaveBeenCalledTimes(1);
    expect(player.cue).toHaveBeenCalledWith(5);
  });

  it("accepts the very start of the video as a position", () => {
    window.history.replaceState({}, "", "/?resumeAt=0&reactionId=b");
    renderPanel(tags);

    expect(player.cue).toHaveBeenCalledWith(0);
  });

  it("ignores a position that is negative or not a number, and falls back to the reaction", () => {
    window.history.replaceState({}, "", "/?resumeAt=-3&reactionId=a");
    const negative = renderPanel(tags);

    expect(player.cue).toHaveBeenCalledTimes(1);
    expect(player.cue).toHaveBeenCalledWith(10);
    negative.unmount();
    player.cue.mockClear();

    window.history.replaceState({}, "", "/?resumeAt=soon&reactionId=b");
    renderPanel(tags);

    expect(player.cue).toHaveBeenCalledTimes(1);
    expect(player.cue).toHaveBeenCalledWith(70);
  });

  it("does nothing for a reaction the post does not have, or without a link to follow", () => {
    window.history.replaceState({}, "", "/?reactionId=zzz");
    const unknown = renderPanel(tags);

    expect(player.cue).not.toHaveBeenCalled();
    unknown.unmount();

    window.history.replaceState({}, "", "/");
    renderPanel(tags);

    expect(player.cue).not.toHaveBeenCalled();
  });

  it("follows the link once the player gets ready", () => {
    player.ready = false;
    window.history.replaceState({}, "", "/?resumeAt=125");

    const view = renderPanel(tags);

    expect(player.cue).not.toHaveBeenCalled();

    player.ready = true;
    view.rerender(
      <PostContext.Provider value={{ post: { id: "p1", tags } as never }}>
        <ReactionOverlayContext.Provider value={view.state as never}>
          <PostReactions />
        </ReactionOverlayContext.Provider>
      </PostContext.Provider>,
    );

    expect(player.cue).toHaveBeenCalledWith(125);
  });

  it("waits for the player", () => {
    player.ready = false;
    window.history.replaceState({}, "", "/?resumeAt=125");
    renderPanel(tags);

    expect(player.cue).not.toHaveBeenCalled();
  });
});

describe("reaction info dialog", () => {
  it("stays closed until it is opened", () => {
    renderPanel([tag("a", 0, anime)]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the entry of the selected reaction", async () => {
    entryState.entry = anime;
    renderPanel([tag("a", 0, anime)], { dialogOpened: true, tag: tag("a", 0, anime) });

    expect(await screen.findByRole("dialog")).toHaveTextContent("Reaction info");
    expect(useEntry).toHaveBeenCalledWith("e1", 0);
    expect(screen.getByRole("heading", { name: "Frieren" })).toBeInTheDocument();
  });

  it("shows the entry's links side by side", async () => {
    entryState.entry = anime;
    renderPanel([tag("a", 0, anime)], { dialogOpened: true, tag: tag("a", 0, anime) });

    const link = await screen.findByRole("button", { name: /View on MyAnimeList/ });

    expect(link.parentElement).toHaveClass("grid-cols-2");
  });

  it("asks for no entry when the reaction has none", async () => {
    entryState.entry = null;
    renderPanel([tag("a")], { dialogOpened: true, tag: tag("a") });

    await screen.findByRole("dialog");

    expect(useEntry).toHaveBeenCalledWith("", 0);
    expect(useEntry).not.toHaveBeenCalledWith("e1", expect.anything());
  });

  it("asks for no entry when no reaction is selected", async () => {
    entryState.entry = null;
    renderPanel([tag("a")], { dialogOpened: true, tag: null });

    await screen.findByRole("dialog");

    expect(useEntry).toHaveBeenCalledWith("", 0);
  });

  it("tells the overlay when it is closed", async () => {
    entryState.entry = anime;

    const { state } = renderPanel([tag("a", 0, anime)], { dialogOpened: true, tag: tag("a", 0, anime) });

    fireEvent.keyDown(await screen.findByRole("dialog"), { key: "Escape" });

    await waitFor(() => expect(state.setDialogOpened).toHaveBeenCalled());
    expect(state.setDialogOpened.mock.calls[0]![0]).toBe(false);
  });
});

describe("login callout", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, ready: false });
  });

  it("stays hidden until the stored sign-in is known, so it never flashes", async () => {
    renderPanel();

    expect(callout()).not.toBeVisible();

    act(() => useAuthStore.getState().setUser(user));
    await expectHidden();
  });

  it("invites to log in with a sentence", async () => {
    renderPanel();
    act(() => useAuthStore.getState().setUser(null));
    await expectShown();

    expect(callout()).toHaveTextContent("Login to KOL PT in order to track your progress.");
  });

  it("shows for a signed-out user, can be dismissed, and returns after a sign-in and out", async () => {
    renderPanel();
    act(() => useAuthStore.getState().setUser(null));
    await expectShown();

    fireEvent.click(screen.getByRole("button", { name: "Login in notice" }));
    await expectHidden();

    act(() => useAuthStore.getState().setUser(user));
    act(() => useAuthStore.getState().setUser(null));
    await expectShown();
  });

  it("hides once the user signs in", async () => {
    renderPanel();
    act(() => useAuthStore.getState().setUser(null));
    await expectShown();

    act(() => useAuthStore.getState().setUser(user));
    await expectHidden();
  });

  it("explains how to log in when hovering the notice", async () => {
    renderPanel();
    act(() => useAuthStore.getState().setUser(null));

    fireEvent.focus(screen.getByText("Login to KOL PT"));

    expect(await screen.findByText("Open the KOL PT extension popup and login to enable progress tracking")).toBeInTheDocument();
  });
});
