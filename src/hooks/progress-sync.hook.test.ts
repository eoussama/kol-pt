import { renderHook, waitFor } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { progressItem } from "../core/storage/items";
import { useProgressStore } from "../state/progress.state";
import { useProgressSync } from "./progress-sync.hook";



const stored = { uid: "u1", posts: { p1: { time: 30, updatedAt: 5 } } };

/**
 * @description
 * Lets pending storage events settle.
 *
 * @returns A promise resolving once they have
 */
const settle = () => new Promise(resolve => setTimeout(resolve, 20));

describe("useProgressSync", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
    useProgressStore.setState({ posts: new Map() });
    await progressItem.removeValue();
  });

  it("loads the saved positions kept in storage", async () => {
    await progressItem.setValue(stored);

    renderHook(() => useProgressSync());

    await waitFor(() => expect([...useProgressStore.getState().posts]).toEqual([["p1", { time: 30, updatedAt: 5 }]]));
  });

  it("clears the positions when storage has none", async () => {
    useProgressStore.setState({ posts: new Map([["p1", { time: 30, updatedAt: 5 }]]) });

    renderHook(() => useProgressSync());

    await waitFor(() => expect(useProgressStore.getState().posts.size).toBe(0));
  });

  it("follows the positions as storage changes", async () => {
    renderHook(() => useProgressSync());
    await settle();

    await progressItem.setValue(stored);
    await waitFor(() => expect(useProgressStore.getState().posts.get("p1")).toEqual({ time: 30, updatedAt: 5 }));

    await progressItem.setValue(null);
    await waitFor(() => expect(useProgressStore.getState().posts.size).toBe(0));
  });

  it("ignores the stored positions once unmounted", async () => {
    let resolve: (value: typeof stored) => void = () => undefined;
    const read = new Promise<typeof stored>((r) => {
      resolve = r;
    });

    vi.spyOn(progressItem, "getValue").mockReturnValue(read);

    const { unmount } = renderHook(() => useProgressSync());

    unmount();
    resolve(stored);
    await read;

    expect(useProgressStore.getState().posts.size).toBe(0);
  });

  it("stops following storage once unmounted", async () => {
    const { unmount } = renderHook(() => useProgressSync());

    await settle();
    unmount();
    await progressItem.setValue(stored);
    await settle();

    expect(useProgressStore.getState().posts.size).toBe(0);
  });

  it("keeps the positions it has when storage cannot be read", async () => {
    useProgressStore.setState({ posts: new Map([["p1", { time: 30, updatedAt: 5 }]]) });
    vi.spyOn(progressItem, "getValue").mockRejectedValue(new Error("unreadable"));

    renderHook(() => useProgressSync());
    await settle();

    expect(useProgressStore.getState().posts.size).toBe(1);
  });
});
