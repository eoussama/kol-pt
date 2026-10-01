import feed from "./__fixtures__/feed.html?raw";
import { findCards, getMountPoint, getPostId, getPostIdFromUrl, insertAt, isLocked, resolveCards, toNumericPostId } from "./post-card";



const FEED_URL = "https://www.patreon.com/cw/SomeCreator/posts";

function loadFeed(): Array<HTMLElement> {
  document.body.innerHTML = feed;

  return findCards(document);
}

describe("getPostIdFromUrl", () => {
  it.each([
    ["https://www.patreon.com/SomeCreator/posts/shows-anime-9-30-171089353", "171089353"],
    ["https://www.patreon.com/posts/171089353", "171089353"],
    ["/posts/discord-stream-171059767/", "171059767"],
    ["https://www.patreon.com/posts/some-post-123?reactionId=abc", "123"],
    ["https://www.patreon.com/posts/some-post-123#comments", "123"],
  ])("extracts the id from %s", (url, id) => {
    expect(getPostIdFromUrl(url)).toBe(id);
  });

  it.each([
    "https://www.patreon.com/cw/SomeCreator/posts",
    "https://www.patreon.com/SomeCreator/posts?filters%5Btag%5D=Anime",
    "https://www.patreon.com/posts/no-number-here",
    "",
  ])("returns null for %s", (url) => {
    expect(getPostIdFromUrl(url)).toBeNull();
  });
});

describe("toNumericPostId", () => {
  it.each([
    ["anime-tonight-2-78568944", "78568944"],
    ["78568944", "78568944"],
    ["no-number", "no-number"],
  ])("reads %s as %s", (id, expected) => {
    expect(toNumericPostId(id)).toBe(expected);
  });
});

describe("post cards in the current feed markup", () => {
  it("finds every card", () => {
    expect(loadFeed()).toHaveLength(4);
  });

  it("detects the locked post", () => {
    const cards = loadFeed();

    expect(cards.map(isLocked)).toEqual([true, false, false, false]);
  });

  it("reads post ids from links, then from the comment box", () => {
    const cards = loadFeed();

    expect(cards.map(getPostId)).toEqual([null, "1001", "1002", "1004"]);
  });

  it("mounts below the tags, else above the like row, else below the body", () => {
    const [, video, text, rendering] = loadFeed() as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];

    const videoPoint = getMountPoint(video);
    const textPoint = getMountPoint(text);
    const renderingPoint = getMountPoint(rendering);

    expect(videoPoint.position).toBe("after");
    expect(videoPoint.anchor.getAttribute("data-tag")).toBe("post-tags");
    expect(textPoint.position).toBe("before");
    expect(textPoint.anchor.getAttribute("data-tag")).toBe("post-details");
    expect(renderingPoint.position).toBe("after");
    expect(renderingPoint.anchor.classList.contains("patreon-post-content")).toBe(true);
  });

  it("inserts inside the card", () => {
    const [, video] = loadFeed() as [HTMLElement, HTMLElement];
    const host = document.createElement("div");

    insertAt(getMountPoint(video), host);

    expect(video.contains(host)).toBe(true);
    expect(host.previousElementSibling?.getAttribute("data-tag")).toBe("post-tags");
  });

  it("resolves unlocked cards only", () => {
    const resolved = resolveCards(loadFeed(), FEED_URL);

    expect([...resolved.values()]).toEqual(["1001", "1002", "1004"]);
  });
});

describe("resolveCards on a post page", () => {
  function card(html: string): HTMLElement {
    const element = document.createElement("div");

    element.setAttribute("data-tag", "post-card");
    element.innerHTML = html;

    return element;
  }

  it("takes the id of a lone unresolved card from the URL", () => {
    const main = card("<div class=\"patreon-post-content\"></div>");
    const resolved = resolveCards([main], "https://www.patreon.com/posts/some-post-555");

    expect(resolved.get(main)).toBe("555");
  });

  it("does not use the URL on a feed", () => {
    const main = card("<div class=\"patreon-post-content\"></div>");

    expect(resolveCards([main], FEED_URL).size).toBe(0);
  });

  it("does not use the URL when another card already has that id", () => {
    const linked = card("<a data-tag=\"post-published-at\" href=\"/posts/x-555\"></a>");
    const bare = card("<div class=\"patreon-post-content\"></div>");
    const resolved = resolveCards([linked, bare], "https://www.patreon.com/posts/x-555");

    expect(resolved.get(linked)).toBe("555");
    expect(resolved.has(bare)).toBe(false);
  });

  it("does not guess between several unresolved cards", () => {
    const first = card("<p></p>");
    const second = card("<p></p>");

    expect(resolveCards([first, second], "https://www.patreon.com/posts/x-555").size).toBe(0);
  });
});
