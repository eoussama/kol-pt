import { act, renderHook } from "@testing-library/react";
import { createMarkStore, usePostMarks } from "./mark-store";



describe("createMarkStore", () => {
  it("keeps when each reaction was marked, replacing it with every sync", () => {
    const store = createMarkStore(async () => []);

    store.getState().setKeys(["p1/t1"], { "p1/t1": 500 });
    expect([...store.getState().markedAt]).toEqual([["p1/t1", 500]]);

    store.getState().setKeys(["p1/t1"]);
    expect(store.getState().markedAt.size).toBe(0);
  });

  it("sends the change as given, and shows the marks the background answers with", async () => {
    const send = vi.fn(async () => ["p.1/t1", "p.1/t2"]);
    const store = createMarkStore(send);

    await expect(store.getState().toggle("p.1", "t2", true)).resolves.toBe(true);

    expect(send).toHaveBeenCalledExactlyOnceWith("p.1", "t2", true);
    expect([...store.getState().posts]).toEqual([["p.1", new Set(["t1", "t2"])]]);
  });

  it("locks the post under its database key, and the lock is per post", async () => {
    let resolve: (keys: Array<string>) => void = () => undefined;
    const store = createMarkStore(() => new Promise(r => resolve = r));

    const toggling = store.getState().toggle("p.1", "t.1", true);

    expect([...store.getState().saving]).toEqual([["p_1", "t_1"]]);
    await expect(store.getState().toggle("p.1", "t2", true)).resolves.toBe(false);

    resolve([]);
    await toggling;
    expect(store.getState().saving.size).toBe(0);
  });

  it("changes nothing, and unlocks the post, when the save fails", async () => {
    const store = createMarkStore(async () => {
      throw new Error("offline");
    });

    store.getState().setKeys(["p1/t1"]);

    await expect(store.getState().toggle("p1", "t1", false)).resolves.toBe(false);
    expect([...store.getState().posts.get("p1") ?? []]).toEqual(["t1"]);
    expect(store.getState().saving.size).toBe(0);
  });
});

describe("usePostMarks", () => {
  it("tells which of a post's reactions are marked, by database key", () => {
    const store = createMarkStore(async () => []);

    store.getState().setKeys(["p_1/t_1"]);

    const { result } = renderHook(() => usePostMarks(store, "p.1"));

    expect(result.current.isMarked("t.1")).toBe(true);
    expect(result.current.isMarked("t2")).toBe(false);
  });

  it("marks nothing for a post without marks", () => {
    const store = createMarkStore(async () => []);
    const { result } = renderHook(() => usePostMarks(store, "p1"));

    expect(result.current.isMarked("t1")).toBe(false);
  });

  it("follows a save in flight: for the post, and for the reaction being saved", async () => {
    let resolve: (keys: Array<string>) => void = () => undefined;
    const store = createMarkStore(() => new Promise(r => resolve = r));
    const { result } = renderHook(() => usePostMarks(store, "p1"));

    expect(result.current.saving).toBe(false);
    expect(result.current.isSaving("t1")).toBe(false);

    let toggling: Promise<boolean> = Promise.resolve(false);

    act(() => {
      toggling = store.getState().toggle("p1", "t1", true);
    });

    expect(result.current.saving).toBe(true);
    expect(result.current.isSaving("t1")).toBe(true);
    expect(result.current.isSaving("t2")).toBe(false);

    await act(async () => {
      resolve(["p1/t1"]);
      await toggling;
    });

    expect(result.current.saving).toBe(false);
    expect(result.current.isMarked("t1")).toBe(true);
  });

  it("ignores the saves of other posts", () => {
    const store = createMarkStore(() => new Promise(() => undefined));
    const { result } = renderHook(() => usePostMarks(store, "p1"));

    act(() => {
      store.getState().toggle("p2", "t1", true);
    });

    expect(result.current.saving).toBe(false);
  });
});
