import { act, renderHook } from "@testing-library/react";
import { request } from "../core/messaging/client";
import { useFavoritesStore, usePostFavorites } from "./favorites.state";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

describe("favorites store", () => {
  beforeEach(() => {
    requestMock.mockReset();
    useFavoritesStore.setState({ posts: new Map(), markedAt: new Map(), saving: new Map() });
  });

  it("saves a favorite through the background, and shows it once confirmed", async () => {
    requestMock.mockResolvedValue(["p1/t1"]);

    await expect(useFavoritesStore.getState().toggle("p1", "t1", true)).resolves.toBe(true);

    expect(requestMock).toHaveBeenCalledExactlyOnceWith("favorites.set", { postId: "p1", tagId: "t1", favorite: true });
    expect([...useFavoritesStore.getState().posts.get("p1") ?? []]).toEqual(["t1"]);
  });
});

describe("usePostFavorites", () => {
  beforeEach(() => {
    useFavoritesStore.setState({ posts: new Map(), markedAt: new Map(), saving: new Map() });
  });

  it("tells which of a post's reactions are favorites, and follows changes", () => {
    const { result } = renderHook(() => usePostFavorites("p1"));

    expect(result.current.isFavorite("t1")).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.isSaving("t1")).toBe(false);

    act(() => useFavoritesStore.getState().setKeys(["p1/t1"]));
    expect(result.current.isFavorite("t1")).toBe(true);
    expect(result.current.isFavorite("t2")).toBe(false);

    act(() => useFavoritesStore.setState({ saving: new Map([["p1", "t2"]]) }));
    expect(result.current.saving).toBe(true);
    expect(result.current.isSaving("t2")).toBe(true);
    expect(result.current.isSaving("t1")).toBe(false);
  });
});
