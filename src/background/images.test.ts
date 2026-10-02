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
  ])("allows %s", (url) => {
    expect(isAllowedImageUrl(url)).toBe(true);
  });

  it.each([
    "http://cdn.myanimelist.net/images/anime/1/2.webp",
    "https://evil.example/cdn.myanimelist.net.png",
    "https://cdn.myanimelist.net.evil.example/a.png",
    "https://notggpht.com/a.png",
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

  it("refuses responses that are not images", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { headers: { "content-type": "text/html" } })));

    await expect(fetchImageAsDataUrl("https://cdn.myanimelist.net/a.png")).resolves.toBeNull();
  });
});
