import type { IPlayerContext } from "./PlayerProvider";

import { act, render, waitFor } from "@testing-library/react";
import { usePlayerStore } from "../../state/player.state";
import { PlayerProvider, usePlayer } from "./PlayerProvider";



/**
 * @description
 * A post card with Patreon's player, around a video whose state the test
 * controls. jsdom has no media pipeline, so playback is faked.
 *
 * @param options - How the video starts
 * @param options.playing - Whether it is already playing
 * @param options.currentTime - Where its playhead is
 * @returns The card, the video and the controls
 */
function videoCard(options: { playing?: boolean; currentTime?: number } = {}) {
  const card = document.createElement("div");

  card.innerHTML = "<div role=\"application\"><video></video></div>";
  document.body.append(card);

  const video = card.querySelector("video") as HTMLVideoElement;
  const player = card.querySelector("[role=\"application\"]") as HTMLElement;
  let paused = !options.playing;

  Object.defineProperty(video, "readyState", { get: () => HTMLMediaElement.HAVE_METADATA });
  Object.defineProperty(video, "paused", { get: () => paused });
  video.currentTime = options.currentTime ?? 0;
  video.play = vi.fn(async () => {
    paused = false;
    video.dispatchEvent(new Event("play"));
  });
  video.pause = vi.fn(() => {
    paused = true;
    video.dispatchEvent(new Event("pause"));
  });
  player.scrollIntoView = vi.fn();

  return {
    card,
    video,
    player,
    emit: (event: string) => act(() => {
      if (event === "play" || event === "playing") {
        paused = false;
      }

      video.dispatchEvent(new Event(event));
    }),
  };
}

/**
 * @description
 * Renders a provider and keeps the latest player context it hands out.
 *
 * @param card - The post card
 * @param postId - The post's ID
 * @returns The render result and the latest context
 */
function renderProvider(card: HTMLElement, postId = "p1") {
  const latest: { current: IPlayerContext | null } = { current: null };

  /**
   * @description
   * Reads the player context.
   *
   * @returns Nothing
   */
  function Probe(): null {
    latest.current = usePlayer();

    return null;
  }

  const view = render(<PlayerProvider card={card} postId={postId}><Probe /></PlayerProvider>);
  const context = () => latest.current as IPlayerContext;

  const change = (nextCard: HTMLElement) => view.rerender(<PlayerProvider card={nextCard} postId={postId}><Probe /></PlayerProvider>);

  return { ...view, context, change };
}

beforeEach(() => {
  usePlayerStore.setState({ playerPostId: null });
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("usePlayer outside a provider", () => {
  it("offers a player that is not ready and does nothing", () => {
    const latest: { current: IPlayerContext | null } = { current: null };

    /**
     * @description
     * Reads the player context.
     *
     * @returns Nothing
     */
    function Probe(): null {
      latest.current = usePlayer();

      return null;
    }

    render(<Probe />);

    expect(latest.current).toMatchObject({ ready: false, playing: false, currentTime: 0 });
    expect(latest.current?.playFrom(10)).toBeUndefined();
    expect(latest.current?.cue(10)).toBeUndefined();
  });
});

describe("playerProvider finding the player", () => {
  it("becomes ready once the card's player is found", async () => {
    const { card } = videoCard();
    const { context } = renderProvider(card);

    await waitFor(() => expect(context().ready).toBe(true));
  });

  it("stays not ready while the card has no player, and becomes ready when one appears", async () => {
    const card = document.createElement("div");

    document.body.append(card);

    const { context } = renderProvider(card);

    expect(context()).toMatchObject({ ready: false, playing: false, currentTime: 0 });

    card.innerHTML = "<video></video>";

    await waitFor(() => expect(context().ready).toBe(true));
  });

  it("stops waiting for a player when unmounted", async () => {
    const card = document.createElement("div");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");

    document.body.append(card);

    const { context, unmount } = renderProvider(card);

    expect(disconnect).not.toHaveBeenCalled();

    unmount();

    expect(disconnect).toHaveBeenCalledTimes(1);
    disconnect.mockRestore();
    card.innerHTML = "<video></video>";
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(context().ready).toBe(false);
  });

  it("starts from the player's state", async () => {
    const { card } = videoCard({ playing: true, currentTime: 30 });
    const { context } = renderProvider(card);

    await waitFor(() => expect(context()).toMatchObject({ ready: true, playing: true, currentTime: 30 }));
  });
});

describe("playerProvider following the player", () => {
  it("follows play, pause and the playhead", async () => {
    const { card, video, emit } = videoCard();
    const { context } = renderProvider(card);

    await waitFor(() => expect(context().ready).toBe(true));

    emit("play");
    expect(context().playing).toBe(true);

    video.currentTime = 12;
    emit("timeupdate");
    expect(context().currentTime).toBe(12);

    emit("pause");
    expect(context().playing).toBe(false);
  });

  it("marks the post as the one playing when it starts", async () => {
    const { card, emit } = videoCard();
    const { context } = renderProvider(card, "p7");

    await waitFor(() => expect(context().ready).toBe(true));
    emit("play");

    expect(usePlayerStore.getState().playerPostId).toBe("p7");
  });

  it("follows the post it is for, not the one it was for", async () => {
    const { card, emit } = videoCard();
    const { context, rerender } = renderProvider(card, "p1");
    const seen: Array<string | null | undefined> = [];
    const unsubscribe = usePlayerStore.subscribe(state => seen.push(state.playerPostId));

    await waitFor(() => expect(context().ready).toBe(true));
    rerender(<PlayerProvider card={card} postId="p2"><span /></PlayerProvider>);
    emit("play");
    unsubscribe();

    expect(seen).toEqual(["p2"]);
  });

  it("stops following the player when unmounted", async () => {
    const { card, emit } = videoCard();
    const { context, unmount } = renderProvider(card);

    await waitFor(() => expect(context().ready).toBe(true));
    unmount();
    emit("play");

    expect(usePlayerStore.getState().playerPostId).toBeNull();
  });
});

describe("playerProvider with several posts", () => {
  it("pauses its video when another post starts playing", async () => {
    const { card, video } = videoCard({ playing: true });
    const { context } = renderProvider(card, "p1");

    await waitFor(() => expect(context().ready).toBe(true));
    expect(video.pause).not.toHaveBeenCalled();

    act(() => usePlayerStore.getState().play("p2"));

    expect(video.pause).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(context().playing).toBe(false));
  });

  it("leaves its video alone when it is the one that started", async () => {
    const { card, video } = videoCard({ playing: true });
    const { context } = renderProvider(card, "p1");

    await waitFor(() => expect(context().ready).toBe(true));
    act(() => usePlayerStore.getState().play("p1"));

    expect(video.pause).not.toHaveBeenCalled();
  });

  it("does not pause a video that is not playing", async () => {
    const { card, video } = videoCard();
    const { context } = renderProvider(card, "p1");

    await waitFor(() => expect(context().ready).toBe(true));
    act(() => usePlayerStore.getState().play("p2"));

    expect(video.pause).not.toHaveBeenCalled();
  });

  it("does not pause its video when no post is marked as playing", async () => {
    const { card, video } = videoCard({ playing: true });
    const { context } = renderProvider(card, "p1");

    await waitFor(() => expect(context().ready).toBe(true));
    act(() => usePlayerStore.getState().pause());

    expect(video.pause).not.toHaveBeenCalled();
  });
});

describe("playerProvider controls", () => {
  it("jumps to a position, plays, and makes the post the active one", async () => {
    const { card, video, player } = videoCard();
    const { context } = renderProvider(card, "p3");

    await waitFor(() => expect(context().ready).toBe(true));
    act(() => context().playFrom(95));

    expect(usePlayerStore.getState().playerPostId).toBe("p3");
    expect(player.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    expect(video.currentTime).toBe(95);
    await waitFor(() => expect(video.play).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(context().playing).toBe(true));
  });

  it("makes the post the active one before the video starts playing", async () => {
    const { card, video } = videoCard();
    const { context } = renderProvider(card, "p3");

    // A video that takes its time to start
    video.play = vi.fn(async () => undefined);
    await waitFor(() => expect(context().ready).toBe(true));
    act(() => context().playFrom(95));

    expect(video.play).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().playerPostId).toBe("p3");
  });

  it("does nothing before the player is found", () => {
    const card = document.createElement("div");

    document.body.append(card);

    const { context } = renderProvider(card);

    act(() => context().playFrom(95));
    act(() => context().cue(95));

    expect(usePlayerStore.getState().playerPostId).toBeNull();
  });

  it("moves the playhead without playing on cue", async () => {
    const { card, video } = videoCard();
    const { context } = renderProvider(card);

    await waitFor(() => expect(context().ready).toBe(true));
    act(() => context().cue(40));

    expect(video.currentTime).toBe(40);
    expect(video.play).not.toHaveBeenCalled();
  });

  it("copes with a player that fails to jump", async () => {
    const { card, video } = videoCard();
    const { context } = renderProvider(card);

    await waitFor(() => expect(context().ready).toBe(true));
    Object.defineProperty(video, "currentTime", {
      get: () => 0,
      set: () => {
        throw new Error("Cannot seek");
      },
    });

    expect(() => act(() => context().playFrom(95))).not.toThrow();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(video.play).not.toHaveBeenCalled();
  });
});

describe("playerProvider changing cards", () => {
  it("lets go of the old player and finds the new one", async () => {
    const first = videoCard();
    const second = videoCard({ currentTime: 77 });
    const { context, rerender } = renderProvider(first.card, "p1");

    await waitFor(() => expect(context().ready).toBe(true));

    rerender(<PlayerProvider card={second.card} postId="p1"><span /></PlayerProvider>);
    first.emit("play");

    expect(usePlayerStore.getState().playerPostId).toBeNull();
  });

  it("is not ready for a card that has no player yet", async () => {
    const first = videoCard();
    const bare = document.createElement("div");
    const { context, change } = renderProvider(first.card, "p1");

    document.body.append(bare);
    await waitFor(() => expect(context().ready).toBe(true));

    change(bare);

    await waitFor(() => expect(context().ready).toBe(false));
  });
});
