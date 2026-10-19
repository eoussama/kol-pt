import { Buffer } from "node:buffer";
import { bytesToBase64, fetchImageAsDataUrl, isAllowedImageUrl } from "./images";



describe("isAllowedImageUrl", () => {
  it.each([
    "https://cdn.myanimelist.net/images/anime/1/2.webp",
    "https://yt3.ggpht.com/abc=s240",
    "https://yt3.googleusercontent.com/abc",
    "https://i.ytimg.com/vi/abc/hqdefault.jpg",
    "https://image.tmdb.org/t/p/w500/a.jpg",
    "https://m.media-amazon.com/images/M/a.jpg",
    "https://s4.anilist.co/file/a.jpg",
    "https://media.kitsu.app/anime/1/a.jpg",
    "https://media.kitsu.io/anime/1/a.jpg",
    "https://upload.wikimedia.org/wikipedia/a.jpg",
    "https://resizing.flixster.com/a.jpg",
    "https://sub.ggpht.com/a.jpg",
  ])("allows %s", (url) => {
    expect(isAllowedImageUrl(url)).toBe(true);
  });

  it.each([
    "http://cdn.myanimelist.net/images/anime/1/2.webp",
    "https://evil.example/cdn.myanimelist.net.png",
    "https://cdn.myanimelist.net.evil.example/a.png",
    "https://notggpht.com/a.png",
    "https://evil.example./a.png",
    "not a url",
  ])("refuses %s", (url) => {
    expect(isAllowedImageUrl(url)).toBe(false);
  });
});

describe("bytesToBase64", () => {
  it("encodes images larger than the engine's argument limit", () => {
    const bytes = new Uint8Array(300_000).map((_, i) => i % 256);

    expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"));
  });
});

describe("fetchImageAsDataUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an image as a data URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } })));

    await expect(fetchImageAsDataUrl("https://cdn.myanimelist.net/a.png")).resolves.toBe("data:image/png;base64,AQID");
  });

  it("does not fetch hosts outside the allowlist", async () => {
    const fetchSpy = vi.fn();

    vi.stubGlobal("fetch", fetchSpy);

    await expect(fetchImageAsDataUrl("https://evil.example/a.png")).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses images over five megabytes, and accepts those just within", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array(5 * 1024 * 1024 + 1), { headers: { "content-type": "image/png" } })));
    await expect(fetchImageAsDataUrl("https://cdn.myanimelist.net/a.png")).resolves.toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array(5 * 1024 * 1024), { headers: { "content-type": "image/png" } })));
    await expect(fetchImageAsDataUrl("https://cdn.myanimelist.net/a.png")).resolves.toMatch(/^data:image\/png;base64,/);
  });

  it("refuses failed responses, and has nothing when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1]), { status: 404, headers: { "content-type": "image/png" } })));
    await expect(fetchImageAsDataUrl("https://cdn.myanimelist.net/a.png")).resolves.toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Network error");
    }));
    await expect(fetchImageAsDataUrl("https://cdn.myanimelist.net/a.png")).resolves.toBeNull();
  });

  it("refuses responses without a content type", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      const response = new Response(new Uint8Array([1]));

      response.headers.delete("content-type");

      return response;
    }));

    await expect(fetchImageAsDataUrl("https://cdn.myanimelist.net/a.png")).resolves.toBeNull();
  });

  it("refuses responses that are not images", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { headers: { "content-type": "text/html" } })));

    await expect(fetchImageAsDataUrl("https://cdn.myanimelist.net/a.png")).resolves.toBeNull();
  });
});

describe("images the background cannot fetch", () => {
  it("leaves AniList's to be shown as they are, without asking for them", async () => {
    const fetch = vi.fn();

    vi.stubGlobal("fetch", fetch);

    await expect(fetchImageAsDataUrl("https://s4.anilist.co/file/a.jpg")).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
