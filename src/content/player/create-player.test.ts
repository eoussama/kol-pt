import { createPlayer, waitForPlayer } from "./create-player";
import { Html5VideoAdapter } from "./html5-video.adapter";
import { VimeoIframeAdapter } from "./vimeo-iframe.adapter";



vi.mock("@vimeo/player", () => ({
  default: class {
    setCurrentTime = vi.fn();
    play = vi.fn();
    pause = vi.fn();
    setMuted = vi.fn();
    on = vi.fn();
    off = vi.fn();
  },
}));

const VIMEO = "https://player.vimeo.com/video/123456?h=abc";
const WRAPPED_VIMEO = `https://wrapper.test/embed?src=${encodeURIComponent(VIMEO)}`;

/**
 * @description
 * Builds a post card with the given markup.
 *
 * @param html - What is inside the card
 * @returns The card
 */
function cardWith(html: string): HTMLElement {
  const card = document.createElement("div");

  card.innerHTML = html;
  document.body.append(card);

  return card;
}

/**
 * @description
 * Lets queued MutationObserver callbacks run.
 *
 * @returns Promise that resolves once they have
 */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

afterEach(() => {
  document.body.replaceChildren();
});

describe("createPlayer", () => {
  it("drives Patreon's native player", () => {
    const card = cardWith("<div role=\"application\"><video></video></div>");
    const player = createPlayer(card);

    expect(player).toBeInstanceOf(Html5VideoAdapter);
    expect(player?.element).toBe(card.querySelector("[role=\"application\"]"));
  });

  it("drives an embedded Vimeo video", () => {
    const card = cardWith(`<iframe src="${VIMEO}"></iframe>`);
    const player = createPlayer(card);

    expect(player).toBeInstanceOf(VimeoIframeAdapter);
    expect(player?.element).toBe(card.querySelector("iframe"));
  });

  it("finds a Vimeo video behind a wrapper page", () => {
    const card = cardWith(`<iframe src="${WRAPPED_VIMEO}"></iframe>`);
    const player = createPlayer(card);

    expect(player).toBeInstanceOf(VimeoIframeAdapter);
    expect(card.querySelector("iframe")?.src).toBe(VIMEO);
  });

  it("skips iframes that are not Vimeo videos", () => {
    const card = cardWith(`<iframe src="https://www.youtube.com/embed/abc"></iframe><iframe id="vimeo" src="${VIMEO}"></iframe>`);

    expect(createPlayer(card)?.element).toBe(card.querySelector("#vimeo"));
  });

  it("prefers the native player to an iframe", () => {
    const card = cardWith(`<iframe src="${VIMEO}"></iframe><video></video>`);

    expect(createPlayer(card)).toBeInstanceOf(Html5VideoAdapter);
  });

  it("finds nothing in a card without a player", () => {
    expect(createPlayer(cardWith("<p>Text only</p>"))).toBeNull();
    expect(createPlayer(cardWith("<iframe src=\"https://www.youtube.com/embed/abc\"></iframe>"))).toBeNull();
  });
});

describe("waitForPlayer", () => {
  it("resolves at once with a player that is there", async () => {
    const card = cardWith("<video></video>");

    await expect(waitForPlayer(card, new AbortController().signal)).resolves.toBeInstanceOf(Html5VideoAdapter);
  });

  it("resolves with nothing when already aborted, even with a player there", async () => {
    const controller = new AbortController();

    controller.abort();

    await expect(waitForPlayer(cardWith("<video></video>"), controller.signal)).resolves.toBeNull();
  });

  it("waits for Patreon to render the player", async () => {
    const card = cardWith("<p>Loading</p>");
    const found = vi.fn();

    waitForPlayer(card, new AbortController().signal).then(found);
    card.append(document.createElement("div"));
    await flush();

    expect(found).not.toHaveBeenCalled();

    card.querySelector("div")?.append(document.createElement("video"));
    await flush();

    expect(found).toHaveBeenCalledTimes(1);
    expect(found.mock.calls[0]?.[0]).toBeInstanceOf(Html5VideoAdapter);
  });

  it("stops watching once it found the player", async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const card = cardWith("");
    const found = waitForPlayer(card, new AbortController().signal);

    expect(disconnect).not.toHaveBeenCalled();

    card.append(document.createElement("video"));
    await found;

    expect(disconnect).toHaveBeenCalledTimes(1);
    disconnect.mockRestore();
  });

  it("gives up with nothing when aborted first, and stops watching", async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const card = cardWith("");
    const controller = new AbortController();
    const result = waitForPlayer(card, controller.signal);

    controller.abort();

    await expect(result).resolves.toBeNull();
    expect(disconnect).toHaveBeenCalledTimes(1);
    disconnect.mockRestore();
  });
});
