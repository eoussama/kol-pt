import { Html5VideoAdapter } from "./html5-video.adapter";



/**
 * @description
 * Builds Patreon's player markup around a video whose loading state the test
 * controls. jsdom has no media pipeline, so readiness and playback are faked.
 *
 * @param playLabel - The Play button's label, which Patreon translates
 * @returns The video, its Play button, the play spy and state controls
 */
function setup(playLabel = "Play") {
  document.body.innerHTML = `
    <div role="application">
      <video preload="none"></video>
      <button type="button" aria-label="${playLabel}"><span><svg data-tag="IconPlaybackPlay"></svg></span></button>
    </div>`;

  const video = document.querySelector("video") as HTMLVideoElement;
  const button = document.querySelector("button") as HTMLButtonElement;
  let readyState = 0;
  let paused = true;

  Object.defineProperty(video, "readyState", { get: () => readyState });
  Object.defineProperty(video, "paused", { get: () => paused });

  const play = vi.fn(async () => {
    paused = false;
    video.dispatchEvent(new Event("play"));
  });

  video.play = play;
  video.pause = vi.fn(() => {
    paused = true;
    video.dispatchEvent(new Event("pause"));
  });

  return {
    video,
    button,
    play,
    loadMetadata: () => {
      readyState = HTMLMediaElement.HAVE_METADATA;
      video.dispatchEvent(new Event("loadedmetadata"));
    },
    startPlaying: () => {
      paused = false;
      video.dispatchEvent(new Event("playing"));
    },
  };
}

describe("html5VideoAdapter", () => {
  it("presses Patreon's Play button before the media is attached, then seeks", async () => {
    const { video, button, play, loadMetadata } = setup();
    const onClick = vi.fn();

    button.addEventListener("click", onClick);

    const adapter = new Html5VideoAdapter(video);

    await adapter.playFrom(120);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(play).not.toHaveBeenCalled();
    expect(video.currentTime).toBe(0);

    loadMetadata();

    expect(video.currentTime).toBe(120);
  });

  it("finds Patreon's Play button whatever the page language", async () => {
    const { video, button } = setup("Lecture");
    const onClick = vi.fn();

    button.addEventListener("click", onClick);
    await new Html5VideoAdapter(video).playFrom(10);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not undo the viewer's own seeking once the jump is over", async () => {
    vi.useFakeTimers();

    const { video, loadMetadata, startPlaying } = setup();

    loadMetadata();
    await new Html5VideoAdapter(video).playFrom(300);
    vi.advanceTimersByTime(5000);

    video.currentTime = 15;
    startPlaying();

    expect(video.currentTime).toBe(15);
    vi.useRealTimers();
  });

  it("seeks and plays directly once the media is loaded", async () => {
    const { video, button, play, loadMetadata } = setup();
    const onClick = vi.fn();

    button.addEventListener("click", onClick);
    loadMetadata();

    const adapter = new Html5VideoAdapter(video);

    await adapter.playFrom(42);

    expect(video.currentTime).toBe(42);
    expect(play).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("puts the playhead back if the page restores a saved position", async () => {
    const { video, loadMetadata, startPlaying } = setup();

    loadMetadata();

    const adapter = new Html5VideoAdapter(video);

    await adapter.playFrom(300);
    video.currentTime = 15;
    startPlaying();

    expect(video.currentTime).toBe(300);
  });

  it("cues without playing", () => {
    const { video, play, loadMetadata } = setup();
    const adapter = new Html5VideoAdapter(video);

    adapter.cue(90);
    loadMetadata();

    expect(video.currentTime).toBe(90);
    expect(play).not.toHaveBeenCalled();
  });

  it("scrolls to the whole player, not just the video", () => {
    const { video } = setup();

    expect(new Html5VideoAdapter(video).element.getAttribute("role")).toBe("application");
  });

  it("reports play state and stops listening on dispose", async () => {
    const { video, loadMetadata } = setup();

    loadMetadata();

    const adapter = new Html5VideoAdapter(video);
    const onPlay = vi.fn();

    adapter.on("play", onPlay);
    await adapter.playFrom(0);

    expect(adapter.isPlaying()).toBe(true);
    expect(onPlay).toHaveBeenCalledTimes(1);

    adapter.dispose();
    adapter.pause();
    await adapter.playFrom(0);

    expect(onPlay).toHaveBeenCalledTimes(1);
  });
});

describe("html5VideoAdapter playback state", () => {
  it("reports the playhead position", () => {
    const { video } = setup();

    video.currentTime = 37;

    expect(new Html5VideoAdapter(video).getCurrentTime()).toBe(37);
  });

  it("is not playing while paused or once ended", () => {
    const { video, startPlaying } = setup();
    const adapter = new Html5VideoAdapter(video);

    expect(adapter.isPlaying()).toBe(false);

    startPlaying();
    expect(adapter.isPlaying()).toBe(true);

    Object.defineProperty(video, "ended", { get: () => true });
    expect(adapter.isPlaying()).toBe(false);
  });

  it("pauses the video", () => {
    const { video } = setup();

    new Html5VideoAdapter(video).pause();

    expect(video.pause).toHaveBeenCalledTimes(1);
  });

  it("falls back to the video when it is not inside Patreon's player", () => {
    const video = document.createElement("video");

    expect(new Html5VideoAdapter(video).element).toBe(video);
  });

  it("does not press play again while the video is already playing", async () => {
    const { video, button, play, loadMetadata, startPlaying } = setup();
    const onClick = vi.fn();

    button.addEventListener("click", onClick);
    loadMetadata();
    startPlaying();
    await new Html5VideoAdapter(video).playFrom(30);

    expect(play).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    expect(video.currentTime).toBe(30);
  });

  it("presses Patreon's Play button when the browser refuses to play", async () => {
    const { video, button, play, loadMetadata } = setup();
    const onClick = vi.fn();

    button.addEventListener("click", onClick);
    loadMetadata();
    play.mockRejectedValueOnce(new Error("NotAllowedError"));
    await new Html5VideoAdapter(video).playFrom(30);

    expect(play).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("copes with a refusal when the page has no Play button", async () => {
    const { video, button, play, loadMetadata } = setup();

    button.remove();
    loadMetadata();
    play.mockRejectedValueOnce(new Error("NotAllowedError"));

    await expect(new Html5VideoAdapter(video).playFrom(30)).resolves.toBeUndefined();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("plays directly when the media is not loaded and there is no Play button", async () => {
    const { video, button, play } = setup();

    button.remove();
    await new Html5VideoAdapter(video).playFrom(30);

    expect(play).toHaveBeenCalledTimes(1);
  });
});

describe("html5VideoAdapter resume guard", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("leaves a position close to the requested one alone", async () => {
    const { video, loadMetadata, startPlaying } = setup();

    loadMetadata();
    await new Html5VideoAdapter(video).playFrom(300);
    video.currentTime = 301.5;
    startPlaying();

    expect(video.currentTime).toBe(301.5);
  });

  it("guards only the latest jump", async () => {
    const { video, loadMetadata, startPlaying } = setup();
    const adapter = new Html5VideoAdapter(video);

    loadMetadata();
    await adapter.playFrom(300);
    await adapter.playFrom(600);
    video.currentTime = 15;
    startPlaying();

    expect(video.currentTime).toBe(600);

    video.currentTime = 20;
    startPlaying();

    expect(video.currentTime).toBe(20);
  });

  it("gives up guarding after a few seconds", async () => {
    vi.useFakeTimers();

    const { video, loadMetadata, startPlaying } = setup();

    loadMetadata();
    await new Html5VideoAdapter(video).playFrom(300);
    vi.advanceTimersByTime(3999);
    video.currentTime = 15;
    startPlaying();
    expect(video.currentTime).toBe(300);

    await new Html5VideoAdapter(video).playFrom(300);
    vi.advanceTimersByTime(4000);
    video.currentTime = 15;
    startPlaying();
    expect(video.currentTime).toBe(15);
  });

  it("stops guarding on dispose", async () => {
    const { video, loadMetadata, startPlaying } = setup();
    const adapter = new Html5VideoAdapter(video);

    loadMetadata();
    await adapter.playFrom(300);
    adapter.dispose();
    video.currentTime = 15;
    startPlaying();

    expect(video.currentTime).toBe(15);
  });
});

describe("html5VideoAdapter listeners", () => {
  it("removes a listener on request, and only that one", () => {
    const { video } = setup();
    const adapter = new Html5VideoAdapter(video);
    const kept = vi.fn();
    const removed = vi.fn();

    adapter.on("timeupdate", kept);
    adapter.on("timeupdate", removed)();
    video.dispatchEvent(new Event("timeupdate"));

    expect(kept).toHaveBeenCalledTimes(1);
    expect(removed).not.toHaveBeenCalled();
  });

  it("applies a cue once, when the metadata loads", () => {
    const { video, loadMetadata } = setup();
    const adapter = new Html5VideoAdapter(video);

    adapter.cue(90);
    loadMetadata();
    video.currentTime = 5;
    loadMetadata();

    expect(video.currentTime).toBe(5);
  });

  it("moves the playhead straight away once the metadata is known", () => {
    const { video, loadMetadata } = setup();
    const adapter = new Html5VideoAdapter(video);

    loadMetadata();
    adapter.cue(90);

    expect(video.currentTime).toBe(90);
  });

  it("stops applying cues on dispose", () => {
    const { video, loadMetadata } = setup();
    const adapter = new Html5VideoAdapter(video);

    adapter.cue(90);
    adapter.dispose();
    loadMetadata();

    expect(video.currentTime).toBe(0);
  });
});
