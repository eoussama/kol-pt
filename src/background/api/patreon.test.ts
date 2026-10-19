import { getPatreonPostDetails } from "./patreon";



/**
 * @description
 * Answers Patreon API requests with the given attributes, or fails them.
 *
 * @param attributes - The post's attributes, a network failure when missing
 * @returns The fetch stub
 */
function stubFetch(attributes?: unknown) {
  const fetch = vi.fn(async (_url: string) => {
    if (attributes === undefined) {
      throw new TypeError("Network error");
    }

    return new Response(JSON.stringify({ data: { attributes } }));
  });

  vi.stubGlobal("fetch", fetch);

  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getPatreonPostDetails", () => {
  it("reads when the post was published, and its thumbnail", async () => {
    const fetch = stubFetch({
      published_at: "2026-10-13T08:19:37.000+00:00",
      image: { large_url: "https://image.mux.com/a/thumbnail.jpg?token=1", url: "https://image.mux.com/a/small.jpg" },
    });

    await expect(getPatreonPostDetails("172223755")).resolves.toEqual({
      publishedAt: Date.parse("2026-10-13T08:19:37.000Z"),
      thumbnail: "https://image.mux.com/a/thumbnail.jpg?token=1",
    });
    expect(fetch.mock.calls[0]?.[0]).toContain("/api/posts/172223755?");
  });

  it("falls back to the small thumbnail", async () => {
    stubFetch({ published_at: null, image: { large_url: null, url: "https://image.mux.com/a/small.jpg" } });

    await expect(getPatreonPostDetails("1")).resolves.toEqual({ publishedAt: null, thumbnail: "https://image.mux.com/a/small.jpg" });
  });

  it("keeps when the post was published without a thumbnail", async () => {
    stubFetch({ published_at: "2026-10-13T08:19:37.000+00:00", image: null });

    await expect(getPatreonPostDetails("1")).resolves.toEqual({ publishedAt: Date.parse("2026-10-13T08:19:37.000Z"), thumbnail: null });

    stubFetch({ published_at: "2026-10-13T08:19:37.000+00:00" });

    await expect(getPatreonPostDetails("1")).resolves.toEqual({ publishedAt: Date.parse("2026-10-13T08:19:37.000Z"), thumbnail: null });
  });

  it("gives up after eight seconds", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetch = stubFetch({ published_at: null, image: null });

    await getPatreonPostDetails("1");

    expect(timeout).toHaveBeenCalledWith(8000);
    expect((fetch.mock.calls[0] as Array<unknown>)[1]).toEqual({ signal: expect.any(AbortSignal) });
    timeout.mockRestore();
  });

  it("knows nothing when Patreon reports an error or answers unexpectedly", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { attributes: { published_at: "2026-10-13T08:19:37.000+00:00" } } }), { status: 404 })));
    await expect(getPatreonPostDetails("1")).resolves.toEqual({ publishedAt: null, thumbnail: null });

    stubFetch("not attributes");
    await expect(getPatreonPostDetails("1")).resolves.toEqual({ publishedAt: null, thumbnail: null });
  });

  it("knows nothing it cannot use", async () => {
    stubFetch({ published_at: "not a date", image: { url: "http://insecure.example/a.jpg" } });
    await expect(getPatreonPostDetails("1")).resolves.toEqual({ publishedAt: null, thumbnail: null });

    stubFetch({ published_at: null, image: null });
    await expect(getPatreonPostDetails("1")).resolves.toEqual({ publishedAt: null, thumbnail: null });

    stubFetch();
    await expect(getPatreonPostDetails("1")).resolves.toEqual({ publishedAt: null, thumbnail: null });
  });
});
