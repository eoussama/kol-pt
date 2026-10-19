import { renderHook, waitFor } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { Entry } from "../core/domain/entry";
import { EEntryType } from "../core/enums/entry-type.enum";
import { request } from "../core/messaging/client";
import { entriesCacheItem, postsCacheItem } from "../core/storage/items";
import { useEntriesStore } from "../state/entries.state";
import { usePostStore } from "../state/posts.state";
import { useContentSync } from "./content-sync.hook";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);
const entry = new Entry({ id: "e1", title: "Frieren", type: EEntryType.MOVIE, altTitles: [] });
const cached = { updatedAt: 1, data: [] };

/**
 * @description
 * Lets pending storage events and requests settle.
 *
 * @returns A promise resolving once they have
 */
const settle = () => new Promise(resolve => setTimeout(resolve, 20));

describe("useContentSync", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    requestMock.mockReset();
    requestMock.mockImplementation(async (type: string) => (type === "posts.list" ? { posts: [], entries: [] } : []) as never);
    usePostStore.setState({ posts: [], error: false, loading: false });
    useEntriesStore.setState({ entries: [], error: false, loading: false });
    await postsCacheItem.removeValue();
    await entriesCacheItem.removeValue();
  });

  it("reloads the posts shown when the posts cache is refreshed", async () => {
    usePostStore.setState({ posts: [{ id: "p1" } as never] });
    renderHook(() => useContentSync());

    await postsCacheItem.setValue(cached);

    await waitFor(() => expect(requestMock).toHaveBeenCalledExactlyOnceWith("posts.list", { force: false }));
    await waitFor(() => expect(usePostStore.getState().posts).toEqual([]));
  });

  it("reloads the entries shown when the entries cache is refreshed", async () => {
    useEntriesStore.setState({ entries: [entry] });
    renderHook(() => useContentSync());

    await entriesCacheItem.setValue(cached);

    await waitFor(() => expect(requestMock).toHaveBeenCalledExactlyOnceWith("entries.list", { force: false }));
    await waitFor(() => expect(useEntriesStore.getState().entries).toEqual([]));
  });

  it("leaves alone what is not shown", async () => {
    renderHook(() => useContentSync());

    await postsCacheItem.setValue(cached);
    await entriesCacheItem.setValue(cached);
    await settle();

    expect(requestMock).not.toHaveBeenCalled();
  });

  it("does not mix up the two caches", async () => {
    usePostStore.setState({ posts: [{ id: "p1" } as never] });
    useEntriesStore.setState({ entries: [entry] });
    renderHook(() => useContentSync());

    await entriesCacheItem.setValue(cached);
    await settle();

    expect(requestMock).toHaveBeenCalledExactlyOnceWith("entries.list", { force: false });
  });

  it("stops reloading once unmounted", async () => {
    usePostStore.setState({ posts: [{ id: "p1" } as never] });
    useEntriesStore.setState({ entries: [entry] });

    const { unmount } = renderHook(() => useContentSync());

    unmount();
    await postsCacheItem.setValue(cached);
    await entriesCacheItem.setValue(cached);
    await settle();

    expect(requestMock).not.toHaveBeenCalled();
  });
});
