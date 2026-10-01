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
