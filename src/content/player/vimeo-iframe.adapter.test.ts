import { toVimeoPlayerUrl, VimeoIframeAdapter } from "./vimeo-iframe.adapter";



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

const vimeo = vi.hoisted(() => ({
  setCurrentTime: vi.fn(async () => 0),
  play: vi.fn(async () => undefined),
  setMuted: vi.fn(async () => true),
  on: vi.fn(),
  off: vi.fn(),
}));

vi.mock("@vimeo/player", () => ({
  default: class {
    setCurrentTime = vimeo.setCurrentTime;
    play = vimeo.play;
    setMuted = vimeo.setMuted;
    on = vimeo.on;
    off = vimeo.off;
  },
}));

describe("vimeoIframeAdapter", () => {
  const url = "https://player.vimeo.com/video/123456?h=abc";

  beforeEach(() => {
    Object.values(vimeo).forEach(mock => mock.mockClear());
  });

  it("lets the iframe autoplay, so the panel can start it", () => {
    const iframe = document.createElement("iframe");

    iframe.setAttribute("allow", "fullscreen; picture-in-picture");
    iframe.src = url;
    const adapter = new VimeoIframeAdapter(iframe, url);

    expect(adapter.element).toBe(iframe);

    expect(iframe.getAttribute("allow")).toBe("fullscreen; picture-in-picture; autoplay");
  });

  it("leaves an iframe that may already autoplay alone", () => {
    const iframe = document.createElement("iframe");

    iframe.setAttribute("allow", "autoplay *; fullscreen");
    iframe.src = url;
    const adapter = new VimeoIframeAdapter(iframe, url);

    expect(adapter.element).toBe(iframe);

    expect(iframe.getAttribute("allow")).toBe("autoplay *; fullscreen");
  });

  it("plays from a time, muted when the browser refuses sound", async () => {
    const iframe = document.createElement("iframe");
    const adapter = new VimeoIframeAdapter(iframe, url);

    await adapter.playFrom(42);

    expect(vimeo.setCurrentTime).toHaveBeenCalledWith(42);
    expect(vimeo.setMuted).not.toHaveBeenCalled();

    vimeo.play.mockRejectedValueOnce(new Error("NotAllowedError"));
    await adapter.playFrom(42);

    expect(vimeo.setMuted).toHaveBeenCalledWith(true);
    expect(vimeo.play).toHaveBeenCalledTimes(3);
  });
});
