import { act, renderHook, waitFor } from "@testing-library/react";
import { request } from "../core/messaging/client";
import { useCoverImage } from "./cover-image.hook";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

/**
 * @description
 * A fetchable cover URL, different on every call: the hook keeps the images
 * it fetched while the page is open.
 *
 * @returns The URL
 */
const nextUrl = (() => {
  let count = 0;

  return () => `https://image.tmdb.org/t/p/cover-${++count}.jpg`;
})();

/**
 * @description
 * A promise settled from outside.
 *
 * @returns The promise and how to settle it
 */
function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe("useCoverImage", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockImplementation(async (_type, payload) => `data:image/jpeg;base64,${(payload as { url: string }).url}` as never);
  });

  it("has no image for a missing URL", () => {
    const { result, rerender } = renderHook(({ url }: { url: string | null | undefined }) => useCoverImage(url), { initialProps: { url: null as string | null | undefined } });

    expect(result.current).toBeNull();

    rerender({ url: undefined });
    expect(result.current).toBeNull();

    rerender({ url: "" });
    expect(result.current).toBeNull();
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("has no image for a URL that is not https", () => {
    const { result } = renderHook(() => useCoverImage("http://image.tmdb.org/t/p/cover.jpg"));

    expect(result.current).toBeNull();
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("fetches the image through the background, showing nothing until it is in", async () => {
    const url = nextUrl();
    const { result } = renderHook(() => useCoverImage(url));

    expect(result.current).toBeNull();

    await waitFor(() => expect(result.current).toBe(`data:image/jpeg;base64,${url}`));
    expect(requestMock).toHaveBeenCalledExactlyOnceWith("images.fetch", { url });
  });

  it("uses AniList images as they are, at once, without fetching them", () => {
    const url = "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/1.jpg";
    const { result } = renderHook(() => useCoverImage(url));

    expect(result.current).toBe(url);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("uses images of hosts it may not fetch as they are, at once", () => {
    const url = "https://example.com/cover.jpg";
    const { result } = renderHook(() => useCoverImage(url));

    expect(result.current).toBe(url);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("uses the URL as it is when the background cannot fetch the image", async () => {
    const url = nextUrl();

    requestMock.mockResolvedValue(null);

    const { result } = renderHook(() => useCoverImage(url));

    await waitFor(() => expect(result.current).toBe(url));
  });

  it("uses the URL as it is when fetching the image fails", async () => {
    const url = nextUrl();

    requestMock.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useCoverImage(url));

    await waitFor(() => expect(result.current).toBe(url));
  });

  it("shows an image it already fetched at once, without fetching it again", async () => {
    const url = nextUrl();
    const first = renderHook(() => useCoverImage(url));

    await waitFor(() => expect(first.result.current).toBe(`data:image/jpeg;base64,${url}`));
    first.unmount();

    const second = renderHook(() => useCoverImage(url));

    expect(second.result.current).toBe(`data:image/jpeg;base64,${url}`);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the fallback URL for an image the background could not fetch", async () => {
    const url = nextUrl();

    requestMock.mockResolvedValue(null);

    const first = renderHook(() => useCoverImage(url));

    await waitFor(() => expect(first.result.current).toBe(url));
    first.unmount();

    expect(renderHook(() => useCoverImage(url)).result.current).toBe(url);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("follows the URL it is given", async () => {
    const [one, two] = [nextUrl(), nextUrl()];
    const { result, rerender } = renderHook(({ url }) => useCoverImage(url), { initialProps: { url: one } });

    await waitFor(() => expect(result.current).toBe(`data:image/jpeg;base64,${one}`));

    rerender({ url: two });
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe(`data:image/jpeg;base64,${two}`));

    rerender({ url: one });
    expect(result.current).toBe(`data:image/jpeg;base64,${one}`);
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it("drops the image when the URL goes away or stops being https", async () => {
    const url = nextUrl();
    const { result, rerender } = renderHook(({ link }: { link: string | null }) => useCoverImage(link), { initialProps: { link: url as string | null } });

    await waitFor(() => expect(result.current).not.toBeNull());

    rerender({ link: null });
    expect(result.current).toBeNull();

    rerender({ link: url });
    expect(result.current).toBe(`data:image/jpeg;base64,${url}`);

    rerender({ link: url.replace("https", "http") });
    expect(result.current).toBeNull();
  });

  it("switches to an AniList image right away", async () => {
    const url = nextUrl();
    const anilist = "https://s4.anilist.co/cover.jpg";
    const { result, rerender } = renderHook(({ link }) => useCoverImage(link), { initialProps: { link: url } });

    await waitFor(() => expect(result.current).toBe(`data:image/jpeg;base64,${url}`));

    rerender({ link: anilist });
    expect(result.current).toBe(anilist);
  });

  it("does not show an image fetched for a URL it has moved on from, but keeps it for later", async () => {
    const [one, two] = [nextUrl(), nextUrl()];
    const slow = deferred<string | null>();

    requestMock.mockImplementation((_type, payload) => ((payload as { url: string }).url === one ? slow.promise : Promise.resolve("data:two")) as never);

    const { result, rerender } = renderHook(({ url }) => useCoverImage(url), { initialProps: { url: one } });

    rerender({ url: two });
    await waitFor(() => expect(result.current).toBe("data:two"));

    await act(async () => {
      slow.resolve("data:one");
      await slow.promise;
    });
    expect(result.current).toBe("data:two");

    rerender({ url: one });
    expect(result.current).toBe("data:one");
  });

  it("keeps only the 20 most recent images", async () => {
    const urls = Array.from({ length: 21 }, nextUrl);
    const { result, rerender } = renderHook(({ url }) => useCoverImage(url), { initialProps: { url: urls[0]! } });

    for (const url of urls) {
      rerender({ url });
      await waitFor(() => expect(result.current).toBe(`data:image/jpeg;base64,${url}`));
    }

    requestMock.mockClear();

    rerender({ url: urls[1]! });
    expect(result.current).toBe(`data:image/jpeg;base64,${urls[1]}`);

    rerender({ url: urls[0]! });
    expect(result.current).toBeNull();
    await waitFor(() => expect(requestMock).toHaveBeenCalledExactlyOnceWith("images.fetch", { url: urls[0] }));
  });

  it("counts an image as recent again when it is kept again", async () => {
    const [shared, ...others] = Array.from({ length: 21 }, nextUrl);
    const pending = [deferred<string | null>(), deferred<string | null>()];
    const slow = [...pending];

    requestMock.mockImplementation((_type, payload) => ((payload as { url: string }).url === shared ? slow.shift()!.promise : Promise.resolve("data:other")) as never);

    const one = renderHook(() => useCoverImage(shared));
    const two = renderHook(() => useCoverImage(shared));

    pending[0]!.resolve("data:shared");
    await waitFor(() => expect(one.result.current).toBe("data:shared"));

    const { result, rerender } = renderHook(({ url }) => useCoverImage(url), { initialProps: { url: others[0]! } });

    for (const url of others.slice(0, 19)) {
      rerender({ url });
      await waitFor(() => expect(result.current).toBe("data:other"));
    }

    pending[1]!.resolve("data:shared");
    await waitFor(() => expect(two.result.current).toBe("data:shared"));

    rerender({ url: others[19]! });
    await waitFor(() => expect(result.current).toBe("data:other"));

    expect(renderHook(() => useCoverImage(shared)).result.current).toBe("data:shared");
    expect(renderHook(() => useCoverImage(others[0]!)).result.current).toBeNull();
  });
});
