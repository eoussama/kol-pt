import feed from "./__fixtures__/feed.html?raw";
import { findCards, getMountPoint, getPostId, getPostIdFromUrl, hasVideo, insertAt, isCreatorPost, isLocked, readPostDetails, resolveCards, toNumericPostId } from "./post-card";



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
    "https://www.patreon.com/posts/some-post-123abc",
    "https://www.patreon.com/posts/some-post-123/edit",
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

  it("mounts below the tags, else below the body", () => {
    const [, video, text, rendering] = loadFeed() as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];

    const videoPoint = getMountPoint(video);
    const textPoint = getMountPoint(text);
    const renderingPoint = getMountPoint(rendering);

    expect(videoPoint.position).toBe("after");
    expect(videoPoint.anchor.getAttribute("data-tag")).toBe("post-tags");
    expect(textPoint.position).toBe("after");
    expect(textPoint.anchor.classList.contains("patreon-post-content")).toBe(true);
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

/**
 * @description
 * Builds a post card.
 *
 * @param html - What is inside it
 * @returns The card
 */
function card(html: string): HTMLElement {
  const element = document.createElement("div");

  element.setAttribute("data-tag", "post-card");
  element.innerHTML = html;

  return element;
}

describe("getPostId", () => {
  it("does not take the comment box's label for the box", () => {
    expect(getPostId(card("<label id=\"comment-section-input-77-label\"></label>"))).toBeNull();
    expect(getPostId(card("<label id=\"comment-section-input-77-label\"></label><textarea id=\"comment-section-input-78\"></textarea>"))).toBe("78");
  });
});

describe("resolveCards on a post page", () => {
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

  it("leaves locked cards out, whatever their links and the URL say", () => {
    const linked = card("<div data-tag=\"paywall-blur\"></div><a data-tag=\"post-published-at\" href=\"/posts/x-444\"></a>");
    const bare = card("<div data-tag=\"locked-badge-button\"></div>");

    expect(resolveCards([linked], FEED_URL).size).toBe(0);
    expect(resolveCards([bare], "https://www.patreon.com/posts/x-555").size).toBe(0);
  });

  it("does not guess between several unresolved cards", () => {
    const first = card("<p></p>");
    const second = card("<p></p>");

    expect(resolveCards([first, second], "https://www.patreon.com/posts/x-555").size).toBe(0);
  });
});

describe("untracked post details", () => {
  it("tells video cards and the creator's posts apart", () => {
    const [, video, discord] = loadFeed();

    expect(hasVideo(video!)).toBe(true);
    expect(hasVideo(discord!)).toBe(false);
    expect(isCreatorPost(discord!, "somecreator", "https://www.patreon.com/home")).toBe(true);
    expect(isCreatorPost(discord!, "Other", "https://www.patreon.com/home")).toBe(false);
    expect(isCreatorPost(discord!, "Other", "https://www.patreon.com/cw/Other/posts")).toBe(true);
  });

  it.each([
    ["a /c/ page", "https://www.patreon.com/c/Other/posts", true],
    ["a /cw/ page", "https://www.patreon.com/cw/Other/posts", true],
    ["their own page", "https://www.patreon.com/Other", true],
    ["another creator's /c/ page", "https://www.patreon.com/c/Another/posts", false],
    ["another creator's /cw/ page", "https://www.patreon.com/cw/Another/posts", false],
    ["a page that merely mentions them", "https://www.patreon.com/home/Other/posts", false],
    ["a page that only starts like theirs", "https://www.patreon.com/cx/Other/posts", false],
  ])("tells the creator's posts apart on %s", (_name, url, expected) => {
    expect(isCreatorPost(card("<p>No links</p>"), "other", url)).toBe(expected);
  });

  it("takes a card for the creator's when any of its links is theirs", () => {
    const mixed = card("<a href=\"https://example.com/elsewhere\">Elsewhere</a><a href=\"https://www.patreon.com/Other\">Other</a>");

    expect(isCreatorPost(mixed, "other", "https://www.patreon.com/home")).toBe(true);
  });

  it("does not take a card without links for the creator's", () => {
    expect(isCreatorPost(card("<p>No links</p>"), "other", "https://www.patreon.com/home")).toBe(false);
  });

  it("reads a title kept on one line, and none for a card without one", () => {
    const titled = card("<span data-tag=\"post-title\">  Part one \n  of   two  </span>");

    expect(readPostDetails(titled, "1").title).toBe("Part one of two");
    expect(readPostDetails(card("<p></p>"), "1")).toEqual({ id: "1", title: "", description: "" });
  });

  it("reads the description line by line, without empty lines", () => {
    const body = card("<div class=\"patreon-post-content\"></div>");

    body.querySelector(".patreon-post-content")!.textContent = "First   line\n\n  Second \n   \nThird\tpart  ";

    expect(readPostDetails(body, "1").description).toBe("First line\nSecond\nThird part");
  });

  it("keeps a description to 5000 characters", () => {
    const body = card("<div class=\"patreon-post-content\"></div>");

    body.querySelector(".patreon-post-content")!.textContent = "a".repeat(6000);

    expect(readPostDetails(body, "1").description).toHaveLength(5000);
  });

  it("reads the post's slug and title to track it", () => {
    const [, video] = loadFeed();

    expect(readPostDetails(video!, "1001")).toMatchObject({ id: "shows-anime-9-30-1001", title: "Shows & Anime" });
    expect(readPostDetails(video!, "9999").id).toBe("9999");
    expect(readPostDetails(video!, "9999", "https://www.patreon.com/posts/some-post-9999?x=1").id).toBe("some-post-9999");
  });
});

describe("getMountPoint without tags", () => {
  it("goes below the body and above the card's last like row, never over a header row", () => {
    document.body.innerHTML = `
      <div data-tag="post-card" id="c">
        <div class="header"><div><div data-tag="post-details"><button>like</button></div></div></div>
        <div class="patreon-post-content"><p>Body</p></div>
        <div class="footer"><div><div data-tag="post-details"><button>like</button></div></div></div>
        <div id="comments"></div>
      </div>
      <div data-tag="post-card" id="d">
        <div class="header"><div><div data-tag="post-details"><button>like</button></div></div></div>
        <div class="footer"><div><div data-tag="post-details"><button>like</button></div></div></div>
        <div id="comments"></div>
      </div>`;

    const withBody = getMountPoint(document.getElementById("c")!);
    const bodyless = getMountPoint(document.getElementById("d")!);

    expect(withBody.position).toBe("after");
    expect(withBody.anchor.classList.contains("patreon-post-content")).toBe(true);
    expect(bodyless.position).toBe("before");
    expect(bodyless.anchor.classList.contains("footer")).toBe(true);
  });
});

describe("getMountPoint around the like rows", () => {
  const row = (name: string) => `<div class="${name}"><div><div data-tag="post-details"><button>like</button></div></div></div>`;

  it("goes above the card's last like row, however many it has", () => {
    const three = card(`${row("one")}${row("two")}${row("three")}`);

    expect(getMountPoint(three).anchor.className).toBe("three");
  });

  it("goes above the outermost wrapper of the row that holds nothing else, inside the card", () => {
    const lone = card(row("only"));
    const wrapper = document.createElement("div");

    wrapper.append(lone);
    document.body.replaceChildren(wrapper);

    expect(getMountPoint(lone).anchor.className).toBe("only");
  });

  it("does not climb out of a wrapper that has company", () => {
    const shared = card("<div class=\"row\"><span>Next to it</span><div class=\"wrap\"><div data-tag=\"post-details\"></div></div></div>");

    expect(getMountPoint(shared).anchor.className).toBe("wrap");
  });

  it("inserts the panel before the row", () => {
    const withRow = card(row("only"));
    const panel = document.createElement("section");

    insertAt(getMountPoint(withRow), panel);

    expect(withRow.firstElementChild).toBe(panel);
    expect(panel.nextElementSibling?.className).toBe("only");
  });
});

describe("getMountPoint without anything to anchor to", () => {
  it("appends the panel to the card", () => {
    document.body.innerHTML = "<div data-tag=\"post-card\" id=\"c\"><p>Only text</p></div>";

    const card = document.getElementById("c")!;
    const point = getMountPoint(card);
    const panel = document.createElement("section");

    expect(point).toEqual({ anchor: card, position: "append" });

    insertAt(point, panel);

    expect(card.lastElementChild).toBe(panel);
    expect(card.children).toHaveLength(2);
  });
});

describe("isCreatorPost with a page URL that cannot be read", () => {
  it("matches no card, whatever its links", () => {
    document.body.innerHTML = `
      <div data-tag="post-card" id="relative"><a href="/someone/posts">Profile</a></div>
      <div data-tag="post-card" id="absolute"><a href="https://www.patreon.com/someone">Profile</a></div>`;

    expect(isCreatorPost(document.getElementById("relative")!, "someone", "not a url")).toBe(false);
    expect(isCreatorPost(document.getElementById("absolute")!, "someone", "not a url")).toBe(false);
    expect(isCreatorPost(document.getElementById("absolute")!, "someone", "https://www.patreon.com/home")).toBe(true);
  });
});
