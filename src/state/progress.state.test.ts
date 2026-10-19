import { act, renderHook } from "@testing-library/react";
import { usePostProgress, useProgressStore } from "./progress.state";



describe("progress store", () => {
  beforeEach(() => {
    useProgressStore.setState({ posts: new Map() });
  });

  it("replaces the saved positions with the stored ones", () => {
    useProgressStore.getState().setPosts({ p1: { time: 30, updatedAt: 5 } });
    useProgressStore.getState().setPosts({ p2: { time: 60, updatedAt: 9 } });

    expect([...useProgressStore.getState().posts]).toEqual([["p2", { time: 60, updatedAt: 9 }]]);
  });

  it("clears the saved positions when none are stored", () => {
    useProgressStore.getState().setPosts({ p1: { time: 30, updatedAt: 5 } });

    useProgressStore.getState().setPosts(null);
    expect(useProgressStore.getState().posts.size).toBe(0);

    useProgressStore.getState().setPosts({ p1: { time: 30, updatedAt: 5 } });
    useProgressStore.getState().setPosts(undefined);
    expect(useProgressStore.getState().posts.size).toBe(0);
  });
});

describe("usePostProgress", () => {
  beforeEach(() => {
    useProgressStore.setState({ posts: new Map() });
  });

  it("reads a post's position by its database key, and follows changes", () => {
    const { result } = renderHook(() => usePostProgress("a.b"));

    expect(result.current).toBeUndefined();

    act(() => useProgressStore.getState().setPosts({ a_b: { time: 42, updatedAt: 1 } }));
    expect(result.current).toEqual({ time: 42, updatedAt: 1 });
  });
});
