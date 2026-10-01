import type { Post } from "../core/domain/post";

import { renderHook } from "@testing-library/react";
import { Tag } from "../core/domain/tag";
import { request } from "../core/messaging/client";
import { useAuthStore } from "../state/auth.state";
import { useProgressStore } from "../state/progress.state";
import { PROGRESS_SAVE_INTERVAL_MS, toSavedPosition, useProgressTracking } from "./progress.hook";



const player = { currentTime: 0, playing: false };

vi.mock("../content/player/PlayerProvider", () => ({ usePlayer: () => player }));
vi.mock("../core/messaging/client", () => ({ request: vi.fn(async () => null) }));

function tag(id: string, startTime: number, endTime: number): Tag {
  return new Tag({ id, entryId: "e1", label: id, description: "", startTime, endTime, context: {} }, null);
}

const post = { id: "p1", tags: [tag("a", 0, 100), tag("b", 100, 250)] } as unknown as Post;

describe("toSavedPosition", () => {
  it("saves whole seconds, skips the very start, forgets after the last reaction", () => {
    expect(toSavedPosition(post, 42.7)).toBe(42);
    expect(toSavedPosition(post, 3)).toBeUndefined();
    expect(toSavedPosition(post, 250)).toBeNull();
  });
});

describe("useProgressTracking", () => {
  const signIn = () => useAuthStore.setState({ user: { uid: "u1", email: null, displayName: null, photoURL: null } });

  function track() {
    const hook = renderHook(() => useProgressTracking(post));

    return (time: number, playing: boolean) => {
      player.currentTime = time;
      player.playing = playing;
      hook.rerender();
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(request).mockClear();
    player.currentTime = 0;
    player.playing = false;
    signIn();
    useProgressStore.setState({ posts: new Map() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves when the video pauses", () => {
    const step = track();

    step(30, true);
    step(61.4, false);

    expect(request).toHaveBeenCalledExactlyOnceWith("progress.set", { postId: "p1", time: 61 });
  });

  it("saves periodically while playing", () => {
    const step = track();

    step(30, true);
    vi.advanceTimersByTime(PROGRESS_SAVE_INTERVAL_MS - 1000);
    step(44, true);
    expect(request).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    step(45, true);
    expect(request).toHaveBeenCalledWith("progress.set", { postId: "p1", time: 45 });
  });

  it("saves when the page is hidden mid-playback", () => {
    const step = track();

    step(80, true);
    window.dispatchEvent(new Event("pagehide"));

    expect(request).toHaveBeenCalledWith("progress.set", { postId: "p1", time: 80 });
  });

  it("forgets the position once every reaction has played, only if one is saved", () => {
    const step = track();

    step(240, true);
    step(251, false);
    expect(request).not.toHaveBeenCalled();

    useProgressStore.setState({ posts: new Map([["p1", { time: 120, updatedAt: 1 }]]) });
    step(252, true);
    step(253, false);
    expect(request).toHaveBeenCalledExactlyOnceWith("progress.set", { postId: "p1", time: null });
  });

  it("saves nothing for signed-out users", () => {
    useAuthStore.setState({ user: null });

    const step = track();

    step(30, true);
    step(60, false);

    expect(request).not.toHaveBeenCalled();
  });
});
