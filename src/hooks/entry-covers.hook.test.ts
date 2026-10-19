import { renderHook, waitFor } from "@testing-library/react";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

/**
 * @description
 * Loads the hook with a fresh memory of the thumbnails last loaded.
 *
 * @returns The hook and the mocked request
 */
async function load() {
  vi.resetModules();

  const { request } = await import("../core/messaging/client");
  const { useEntryCovers } = await import("./entry-covers.hook");

  return { useEntryCovers, request: vi.mocked(request) };
}

describe("useEntryCovers", () => {
  it("has no thumbnails until they are found, then lists them by entry", async () => {
    const { useEntryCovers, request } = await load();

    request.mockResolvedValue({ e1: "https://image.tmdb.org/1.jpg" });

    const { result } = renderHook(() => useEntryCovers());

    expect(result.current).toEqual({});

    await waitFor(() => expect(result.current).toEqual({ e1: "https://image.tmdb.org/1.jpg" }));
    expect(request).toHaveBeenCalledExactlyOnceWith("entries.covers", {});
  });

  it("shows the thumbnails last loaded at once when shown again, and refreshes them", async () => {
    const { useEntryCovers, request } = await load();

    request.mockResolvedValueOnce({ e1: "one.jpg" });

    const first = renderHook(() => useEntryCovers());

    await waitFor(() => expect(first.result.current).toEqual({ e1: "one.jpg" }));
    first.unmount();

    request.mockResolvedValueOnce({ e1: "one.jpg", e2: "two.jpg" });

    const second = renderHook(() => useEntryCovers());

    expect(second.result.current).toEqual({ e1: "one.jpg" });
    await waitFor(() => expect(second.result.current).toEqual({ e1: "one.jpg", e2: "two.jpg" }));
  });

  it("does not show thumbnails found after it is gone, but keeps them for next time", async () => {
    const { useEntryCovers, request } = await load();
    let resolve: (value: Record<string, string>) => void = () => undefined;
    const found = new Promise<Record<string, string>>((r) => {
      resolve = r;
    });

    request.mockReturnValueOnce(found as never);

    const first = renderHook(() => useEntryCovers());

    first.unmount();
    resolve({ e1: "one.jpg" });
    await found;

    expect(first.result.current).toEqual({});

    request.mockReturnValueOnce(new Promise(() => undefined) as never);

    expect(renderHook(() => useEntryCovers()).result.current).toEqual({ e1: "one.jpg" });
  });

  it("keeps showing what it has when the thumbnails cannot be found", async () => {
    const { useEntryCovers, request } = await load();

    request.mockResolvedValueOnce({ e1: "one.jpg" });

    const first = renderHook(() => useEntryCovers());

    await waitFor(() => expect(first.result.current).toEqual({ e1: "one.jpg" }));

    request.mockRejectedValueOnce(new Error("offline"));

    const second = renderHook(() => useEntryCovers());

    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    await Promise.resolve();
    expect(second.result.current).toEqual({ e1: "one.jpg" });
  });
});
