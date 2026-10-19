import type { Post } from "../core/domain/post";

import { renderHook } from "@testing-library/react";
import { Tag } from "../core/domain/tag";
import { useAuthStore } from "../state/auth.state";
import { useWatchlistStore } from "../state/watchlist.state";
import { findFinishedReactions, useAutoWatch } from "./auto-watch.hook";



const player = { currentTime: 0, playing: true };

vi.mock("../content/player/PlayerProvider", () => ({ usePlayer: () => player }));

function tag(id: string, startTime: number, endTime: number): Tag {
  return new Tag({ id, entryId: "e1", label: id, description: "", startTime, endTime, context: {} }, null);
}

const tags = [tag("a", 0, 100), tag("b", 100, 250)];
const post = { id: "p1", tags } as unknown as Post;

describe("findFinishedReactions", () => {
  it("finds a reaction whose end was just played through", () => {
    expect(findFinishedReactions(tags, 99.5, 100.2).map(t => t.id)).toEqual(["a"]);
  });

  it("ignores reactions still playing or already over", () => {
    expect(findFinishedReactions(tags, 50, 50.25)).toEqual([]);
    expect(findFinishedReactions(tags, 100.2, 100.5)).toEqual([]);
  });

  it("counts a jump of up to three seconds as playing, and anything more as seeking", () => {
    expect(findFinishedReactions(tags, 97, 100).map(t => t.id)).toEqual(["a"]);
    expect(findFinishedReactions(tags, 96.9, 100)).toEqual([]);
  });

  it("finds a reaction ending exactly at the new position, but not one ending exactly at the old", () => {
    expect(findFinishedReactions(tags, 99.5, 100).map(t => t.id)).toEqual(["a"]);
    expect(findFinishedReactions(tags, 100, 100.5)).toEqual([]);
  });

  it("ignores seeking past the end, forward or back", () => {
    expect(findFinishedReactions(tags, 90, 120)).toEqual([]);
    expect(findFinishedReactions(tags, 120, 99)).toEqual([]);
  });
});

describe("useAutoWatch", () => {
  const toggle = vi.fn(async (_postId: string, _tagId: string, _watched: boolean) => true);

  function play(times: Array<number>) {
    player.currentTime = times[0] ?? 0;

    const hook = renderHook(() => useAutoWatch(post));

    for (const time of times.slice(1)) {
      player.currentTime = time;
      hook.rerender();
    }

    return hook;
  }

  beforeEach(() => {
    toggle.mockClear();
    player.playing = true;
    useAuthStore.setState({ user: { uid: "u1", email: null, displayName: null, photoURL: null } });
    useWatchlistStore.setState({ posts: new Map(), markedAt: new Map(), saving: new Map(), toggle });
  });

  it("marks a reaction watched once it finishes playing", () => {
    play([99.5, 99.75, 100.1]);

    expect(toggle).toHaveBeenCalledWith("p1", "a", true);
  });

  it("does nothing for signed-out users, while paused, or when seeking", () => {
    useAuthStore.setState({ user: null });
    play([99.5, 100.1]);

    useAuthStore.setState({ user: { uid: "u1", email: null, displayName: null, photoURL: null } });
    player.playing = false;
    play([99.5, 100.1]);

    player.playing = true;
    play([50, 120]);

    expect(toggle).not.toHaveBeenCalled();
  });

  it("does not count the first position it sees as playing from the start", () => {
    const short = { id: "p3", tags: [tag("s", 0, 1)] } as unknown as Post;

    player.currentTime = 2;
    renderHook(() => useAutoWatch(short));

    expect(toggle).not.toHaveBeenCalled();
  });

  it("leaves reactions already watched alone", () => {
    useWatchlistStore.setState({ posts: new Map([["p1", new Set(["a"])]]) });
    play([99.5, 100.1]);

    expect(toggle).not.toHaveBeenCalled();
  });

  it("handles each reaction once, so unticking it sticks", () => {
    play([99.5, 100.1, 90, 99.5, 100.1]);

    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("keeps marking the next reactions when marking one fails", async () => {
    toggle.mockRejectedValueOnce(new Error("offline"));

    play([99.5, 100.1, 249.5, 250.1]);
    await Promise.resolve();

    expect(toggle.mock.calls.map(call => call[1])).toEqual(["a", "b"]);
  });

  it("marks several reactions that end in the same update", () => {
    const together = { id: "p2", tags: [tag("x", 0, 100), tag("y", 50, 100)] } as unknown as Post;
    const hook = renderHook(() => useAutoWatch(together));

    player.currentTime = 99.5;
    hook.rerender();
    player.currentTime = 100.1;
    hook.rerender();

    expect(toggle.mock.calls.map(call => call[1])).toEqual(["x", "y"]);
  });
});
