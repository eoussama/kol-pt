import { renderHook, waitFor } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { favoritesItem, watchlistItem } from "../core/storage/items";
import { useFavoritesStore } from "../state/favorites.state";
import { useWatchlistStore } from "../state/watchlist.state";
import { useWatchlistSync } from "./watchlist-sync.hook";



/**
 * @description
 * Lets pending storage events settle.
 *
 * @returns A promise resolving once they have
 */
const settle = () => new Promise(resolve => setTimeout(resolve, 20));

/**
 * @description
 * What a store holds, as plain data.
 *
 * @param store - The store's state
 * @param store.posts - Its marked reactions, by post
 * @param store.markedAt - When they were marked
 * @returns The marked reactions of each post and when they were marked
 */
function snapshot(store: { posts: ReadonlyMap<string, ReadonlySet<string>>; markedAt: ReadonlyMap<string, number> }) {
  return {
    posts: Object.fromEntries([...store.posts].map(([post, tags]) => [post, [...tags]])),
    markedAt: Object.fromEntries(store.markedAt),
  };
}

describe("useWatchlistSync", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
    useWatchlistStore.setState({ posts: new Map(), markedAt: new Map(), saving: new Map() });
    useFavoritesStore.setState({ posts: new Map(), markedAt: new Map(), saving: new Map() });
    await watchlistItem.removeValue();
    await favoritesItem.removeValue();
  });

  it("loads the watchlist and the favorites kept in storage, each into its own store", async () => {
    await watchlistItem.setValue({ uid: "u1", keys: ["p1/t1", "p1/t2"], watchedAt: { "p1/t1": 100 } });
    await favoritesItem.setValue({ uid: "u1", keys: ["p2/t3"], watchedAt: { "p2/t3": 200 } });

    renderHook(() => useWatchlistSync());

    await waitFor(() => expect(snapshot(useWatchlistStore.getState())).toEqual({ posts: { p1: ["t1", "t2"] }, markedAt: { "p1/t1": 100 } }));
    await waitFor(() => expect(snapshot(useFavoritesStore.getState())).toEqual({ posts: { p2: ["t3"] }, markedAt: { "p2/t3": 200 } }));
  });

  it("empties both stores when storage has nothing", async () => {
    useWatchlistStore.getState().setKeys(["p1/t1"], { "p1/t1": 1 });
    useFavoritesStore.getState().setKeys(["p1/t1"], { "p1/t1": 1 });

    renderHook(() => useWatchlistSync());

    await waitFor(() => expect(snapshot(useWatchlistStore.getState())).toEqual({ posts: {}, markedAt: {} }));
    await waitFor(() => expect(snapshot(useFavoritesStore.getState())).toEqual({ posts: {}, markedAt: {} }));
  });

  it("follows both as storage changes, in every tab", async () => {
    renderHook(() => useWatchlistSync());
    await settle();

    await watchlistItem.setValue({ uid: "u1", keys: ["p1/t1"], watchedAt: { "p1/t1": 7 } });
    await waitFor(() => expect(snapshot(useWatchlistStore.getState())).toEqual({ posts: { p1: ["t1"] }, markedAt: { "p1/t1": 7 } }));
    expect(useFavoritesStore.getState().posts.size).toBe(0);

    await favoritesItem.setValue({ uid: "u1", keys: ["p2/t2"] });
    await waitFor(() => expect(snapshot(useFavoritesStore.getState())).toEqual({ posts: { p2: ["t2"] }, markedAt: {} }));

    await watchlistItem.setValue(null);
    await waitFor(() => expect(useWatchlistStore.getState().posts.size).toBe(0));
    expect(useFavoritesStore.getState().posts.size).toBe(1);

    await favoritesItem.setValue(null);
    await waitFor(() => expect(useFavoritesStore.getState().posts.size).toBe(0));
  });

  it("ignores what storage held once unmounted", async () => {
    const resolvers: Array<() => void> = [];
    const hold = <T>(value: T) => new Promise<T>((resolve) => {
      resolvers.push(() => resolve(value));
    });

    vi.spyOn(watchlistItem, "getValue").mockReturnValue(hold({ uid: "u1", keys: ["p1/t1"] }));
    vi.spyOn(favoritesItem, "getValue").mockReturnValue(hold({ uid: "u1", keys: ["p1/t1"] }));

    const { unmount } = renderHook(() => useWatchlistSync());

    unmount();
    resolvers.forEach(resolve => resolve());
    await settle();

    expect(useWatchlistStore.getState().posts.size).toBe(0);
    expect(useFavoritesStore.getState().posts.size).toBe(0);
  });

  it("stops following storage once unmounted", async () => {
    const { unmount } = renderHook(() => useWatchlistSync());

    await settle();
    unmount();
    await watchlistItem.setValue({ uid: "u1", keys: ["p1/t1"] });
    await favoritesItem.setValue({ uid: "u1", keys: ["p1/t1"] });
    await settle();

    expect(useWatchlistStore.getState().posts.size).toBe(0);
    expect(useFavoritesStore.getState().posts.size).toBe(0);
  });

  it("keeps what it has when storage cannot be read", async () => {
    useWatchlistStore.getState().setKeys(["p1/t1"]);
    useFavoritesStore.getState().setKeys(["p1/t1"]);
    vi.spyOn(watchlistItem, "getValue").mockRejectedValue(new Error("unreadable"));
    vi.spyOn(favoritesItem, "getValue").mockRejectedValue(new Error("unreadable"));

    renderHook(() => useWatchlistSync());
    await settle();

    expect(useWatchlistStore.getState().posts.size).toBe(1);
    expect(useFavoritesStore.getState().posts.size).toBe(1);
  });
});
