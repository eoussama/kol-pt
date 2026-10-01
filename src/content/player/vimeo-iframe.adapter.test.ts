import { toVimeoPlayerUrl } from "./vimeo-iframe.adapter";



describe("toVimeoPlayerUrl", () => {
  it("keeps a direct Vimeo player URL", () => {
    const src = "https://player.vimeo.com/video/123456?h=abc&app_id=1";

    expect(toVimeoPlayerUrl(src)).toBe(src);
  });

  it("unwraps a Vimeo URL carried in any query parameter", () => {
    const vimeo = "https://player.vimeo.com/video/123456?h=abc";
    const src = `https://cdn.embedly.example/widgets/media.html?type=text%2Fhtml&src=${encodeURIComponent(vimeo)}&display_name=Vimeo`;

    expect(toVimeoPlayerUrl(src)).toBe(vimeo);
  });

  it.each([
    "https://www.youtube.com/embed/abc",
    "https://cdn.embedly.example/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2Fabc",
    "about:blank",
    "",
  ])("returns null for %s", (src) => {
    expect(toVimeoPlayerUrl(src)).toBeNull();
  });
});
