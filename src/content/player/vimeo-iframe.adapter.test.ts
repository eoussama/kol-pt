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

type TListener = (data?: unknown) => void;

const vimeo = vi.hoisted(() => {
  const listeners = new Map<string, Array<TListener>>();

  return {
    listeners,
    setCurrentTime: vi.fn(async (_seconds: number) => 0),
    play: vi.fn(async () => undefined),
    pause: vi.fn(async () => undefined),
    setMuted: vi.fn(async (_muted: boolean) => true),
    on: vi.fn((event: string, listener: TListener) => {
      listeners.set(event, [...listeners.get(event) ?? [], listener]);
    }),
    off: vi.fn((event: string, listener: TListener) => {
      listeners.set(event, (listeners.get(event) ?? []).filter(registered => registered !== listener));
    }),
    emit(event: string, data?: unknown) {
      (listeners.get(event) ?? []).forEach(listener => listener(data));
    },
  };
});

vi.mock("@vimeo/player", () => ({
  default: class {
    setCurrentTime = vimeo.setCurrentTime;
    play = vimeo.play;
    pause = vimeo.pause;
    setMuted = vimeo.setMuted;
    on = vimeo.on;
    off = vimeo.off;
  },
}));

/**
 * @description
 * An iframe that records every time its source is set.
 *
 * @param src - The source it starts with
 * @param allow - Its permissions
 * @returns The iframe and the sources set on it
 */
function trackedIframe(src: string, allow?: string) {
  const iframe = document.createElement("iframe");
  const assigned: Array<string> = [];
  let current = src;

  if (allow) {
    iframe.setAttribute("allow", allow);
  }

  Object.defineProperty(iframe, "src", {
    get: () => current,
    set: (value: string) => {
      current = value;
      assigned.push(value);
    },
  });

  return { iframe, assigned };
}

describe("vimeoIframeAdapter", () => {
  const url = "https://player.vimeo.com/video/123456?h=abc";
  const adapt = (iframe: HTMLIFrameElement) => new VimeoIframeAdapter(iframe, url);

  beforeEach(() => {
    vimeo.listeners.clear();
    [vimeo.setCurrentTime, vimeo.play, vimeo.pause, vimeo.setMuted, vimeo.on, vimeo.off].forEach(mock => mock.mockClear());
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

  it("allows autoplay on an iframe with no permissions at all", () => {
    const iframe = document.createElement("iframe");

    adapt(iframe);

    expect(iframe.getAttribute("allow")).toBe("autoplay");
  });

  it("does not take another feature for autoplay", () => {
    const iframe = document.createElement("iframe");

    iframe.setAttribute("allow", "autoplay-extra; fullscreen");
    adapt(iframe);

    expect(iframe.getAttribute("allow")).toBe("autoplay-extra; fullscreen; autoplay");
  });

  it("reloads an iframe that goes through a wrapper page", () => {
    const { iframe, assigned } = trackedIframe("https://wrapper.test/embed?src=x", "autoplay");

    adapt(iframe);

    expect(assigned).toEqual([url]);
  });

  it("reloads an iframe so that it may autoplay, even when it points at the player", () => {
    const { iframe, assigned } = trackedIframe(url, "fullscreen");

    adapt(iframe);

    expect(assigned).toEqual([url]);
  });

  it("does not reload an iframe that points at the player and may autoplay", () => {
    const { iframe, assigned } = trackedIframe(url, "autoplay");

    adapt(iframe);

    expect(assigned).toEqual([]);
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

  it("moves the playhead before playing", async () => {
    const adapter = new VimeoIframeAdapter(document.createElement("iframe"), url);

    await adapter.playFrom(42);

    expect(vimeo.setCurrentTime.mock.invocationCallOrder[0]).toBeLessThan(vimeo.play.mock.invocationCallOrder[0]!);
  });

  it("fails when even muted playback is refused", async () => {
    const adapter = new VimeoIframeAdapter(document.createElement("iframe"), url);

    vimeo.play.mockRejectedValueOnce(new Error("NotAllowedError")).mockRejectedValueOnce(new Error("Still refused"));

    await expect(adapter.playFrom(1)).rejects.toThrow("Still refused");
  });

  it("follows the player's position and state", () => {
    const adapter = new VimeoIframeAdapter(document.createElement("iframe"), url);

    expect(adapter.getCurrentTime()).toBe(0);
    expect(adapter.isPlaying()).toBe(false);

    vimeo.emit("timeupdate", { seconds: 12.5 });
    vimeo.emit("play");

    expect(adapter.getCurrentTime()).toBe(12.5);
    expect(adapter.isPlaying()).toBe(true);

    vimeo.emit("pause");

    expect(adapter.isPlaying()).toBe(false);
  });

  it("is up to date when its listeners run", () => {
    const adapter = new VimeoIframeAdapter(document.createElement("iframe"), url);
    const seen: Array<[number, boolean]> = [];

    adapter.on("timeupdate", () => seen.push([adapter.getCurrentTime(), adapter.isPlaying()]));
    adapter.on("play", () => seen.push([adapter.getCurrentTime(), adapter.isPlaying()]));
    vimeo.emit("timeupdate", { seconds: 3 });
    vimeo.emit("play");

    expect(seen).toEqual([[3, false], [3, true]]);
  });

  it("calls a listener without the player's event data, until it is removed", () => {
    const adapter = new VimeoIframeAdapter(document.createElement("iframe"), url);
    const listener = vi.fn();
    const remove = adapter.on("timeupdate", listener);

    vimeo.emit("timeupdate", { seconds: 1 });

    expect(listener).toHaveBeenCalledExactlyOnceWith();

    remove();
    vimeo.emit("timeupdate", { seconds: 2 });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("cues and pauses without waiting, and ignores the player's refusals", async () => {
    const adapter = new VimeoIframeAdapter(document.createElement("iframe"), url);

    adapter.cue(30);
    adapter.pause();

    expect(vimeo.setCurrentTime).toHaveBeenCalledWith(30);
    expect(vimeo.pause).toHaveBeenCalledTimes(1);

    vimeo.setCurrentTime.mockRejectedValueOnce(new Error("not ready"));
    vimeo.pause.mockRejectedValueOnce(new Error("not ready"));
    adapter.cue(31);
    adapter.pause();
    await Promise.resolve();

    expect(vimeo.setCurrentTime).toHaveBeenCalledTimes(2);
    expect(vimeo.pause).toHaveBeenCalledTimes(2);
  });

  it("stops listening to the player on dispose", () => {
    const adapter = new VimeoIframeAdapter(document.createElement("iframe"), url);
    const listener = vi.fn();

    adapter.on("play", listener);
    adapter.dispose();
    vimeo.emit("play");
    vimeo.emit("timeupdate", { seconds: 9 });

    expect(listener).not.toHaveBeenCalled();
    expect(adapter.isPlaying()).toBe(false);
    expect(adapter.getCurrentTime()).toBe(0);
    expect(vimeo.listeners.get("play")).toEqual([]);
    expect(vimeo.listeners.get("pause")).toEqual([]);
    expect(vimeo.listeners.get("timeupdate")).toEqual([]);
  });
});
