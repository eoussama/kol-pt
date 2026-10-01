import type { Post } from "../../core/models/post.model";

import feed from "../patreon/__fixtures__/feed.html?raw";
import { findCards } from "../patreon/post-card";
import { HOST_ATTRIBUTE } from "../patreon/selectors";
import { CardRegistry } from "./card-registry";
import { EmbedController } from "./embed-controller";



const FEED_URL = "https://www.patreon.com/cw/SomeCreator/posts";

function post(id: string): Post {
  return { id, tags: [] } as unknown as Post;
}

function hosts(): Array<Element> {
  return Array.from(document.querySelectorAll(`[${HOST_ATTRIBUTE}]`));
}

describe("embedController", () => {
  let registry: CardRegistry;
  let controller: EmbedController;

  beforeEach(() => {
    document.body.innerHTML = feed;
    registry = new CardRegistry();
    controller = new EmbedController(registry, document, () => FEED_URL);
  });

  it("shows a loader in every unlocked card while posts load", () => {
    controller.sync();

    expect(registry.getSnapshot().map(e => [e.postId, e.post])).toEqual([["1001", null], ["1002", null], ["1004", null]]);
    expect(hosts()).toHaveLength(3);
  });

  it("keeps panels for tracked posts only once posts arrive", () => {
    controller.sync();
    controller.setPosts([post("1001")]);

    const [embed] = registry.getSnapshot();

    expect(registry.getSnapshot()).toHaveLength(1);
    expect(embed?.postId).toBe("1001");
    expect(embed?.post?.id).toBe("1001");
    expect(hosts()).toHaveLength(1);
    expect(embed?.card.style.boxShadow).not.toBe("");
  });

  it("mounts cards added after the posts loaded", () => {
    controller.setPosts([post("1001"), post("2001")]);

    const late = document.createElement("div");

    late.setAttribute("data-tag", "post-card");
    late.innerHTML = "<a data-tag=\"post-published-at\" href=\"/posts/late-2001\"></a><div data-tag=\"post-details\"></div>";
    document.querySelector("[data-tag=\"cw-post-stream-container\"]")?.append(late);
    controller.sync();

    expect(registry.getSnapshot().map(e => e.postId)).toEqual(["1001", "2001"]);
  });

  it("puts the panel back if the page drops it", () => {
    controller.setPosts([post("1001")]);

    const [embed] = registry.getSnapshot();

    embed?.host.remove();
    controller.sync();

    expect(embed?.host.isConnected).toBe(true);
    expect(registry.getSnapshot()).toHaveLength(1);
  });

  it("forgets cards that leave the page", () => {
    controller.setPosts([post("1001")]);

    const [card] = findCards(document).filter(c => registry.get(c));

    card?.remove();
    controller.sync();

    expect(registry.getSnapshot()).toHaveLength(0);
  });

  it("does not mount twice", () => {
    controller.setPosts([post("1001")]);
    controller.sync();
    controller.sync();

    expect(hosts()).toHaveLength(1);
  });

  it("removes everything on dispose", () => {
    controller.setPosts([post("1001")]);
    controller.dispose();

    expect(hosts()).toHaveLength(0);
    expect(registry.getSnapshot()).toHaveLength(0);
    expect(findCards(document).every(card => card.style.boxShadow === "")).toBe(true);
  });
});
