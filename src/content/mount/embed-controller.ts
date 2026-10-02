import type { Post } from "../../core/domain/post";
import type { CardRegistry, ICardEmbed } from "./card-registry";

import { findCards, getMountPoint, hasVideo, insertAt, isCreatorPost, resolveCards, toNumericPostId } from "../patreon/post-card";
import { HOST_ATTRIBUTE } from "../patreon/selectors";



/**
 * @description
 * Inline styles that mark a card as tracked.
 */
const TRACKED_CARD_STYLE = {
  borderRadius: "10px",
  boxShadow: "0 0 20px 0px rgba(25, 118, 210, 0.5)",
} as const;

/**
 * @description
 * Keeps one reactions panel in every Patreon card whose post is tracked.
 * While the tracked posts are loading, every unlocked card shows a loader.
 * The creator's video posts that are not tracked get a panel too, marked
 * untracked, so they can be reported or tracked.
 */
export class EmbedController {
  private posts: Map<string, Post> | null = null;

  private sequence = 0;

  /**
   * @description
   * Creates a controller.
   *
   * @param registry - Where mounted panels are published for React
   * @param root - Where to look for cards
   * @param getPageUrl - Returns the current page URL
   * @param creator - The creator whose untracked video posts get a panel, none if empty
   */
  constructor(
    private readonly registry: CardRegistry,
    private readonly root: ParentNode = document,
    private readonly getPageUrl: () => string = () => window.location.href,
    private readonly creator: string = "",
  ) { }

  /**
   * @description
   * Sets the tracked posts and updates the page.
   *
   * @param posts - Every tracked post
   */
  setPosts(posts: Array<Post>): void {
    // Cards are identified by Patreon's numeric id, posts by their URL slug
    this.posts = new Map(posts.map(post => [toNumericPostId(post.id), post]));
    this.sync();
  }

  /**
   * @description
   * Brings the mounted panels in line with the cards on the page.
   */
  sync(): void {
    const pageUrl = this.getPageUrl();
    const resolved = resolveCards(findCards(this.root), pageUrl);

    for (const embed of this.registry.values()) {
      const postId = resolved.get(embed.card);

      if (!embed.card.isConnected || postId !== embed.postId || !this.wantsPanel(embed.card, postId, pageUrl)) {
        this.unmount(embed);
      }
    }

    for (const [card, postId] of resolved) {
      if (!this.wantsPanel(card, postId, pageUrl)) {
        continue;
      }

      const post = this.posts?.get(postId) ?? null;
      const untracked = this.posts !== null && post === null;
      const existing = this.registry.get(card);

      if (!existing) {
        this.mount(card, postId, post, untracked);

        continue;
      }

      // Patreon may re-render the card's content and drop the panel
      if (!existing.host.isConnected) {
        insertAt(getMountPoint(card), existing.host);
      }

      if (existing.post !== post || existing.untracked !== untracked) {
        this.registry.set({ ...existing, post, untracked });
        this.styleCard(card, post !== null);
      }
    }
  }

  /**
   * @description
   * Removes every panel from the page.
   */
  dispose(): void {
    this.registry.values().forEach(embed => this.unmount(embed));
  }

  /**
   * @description
   * Whether a card gets a panel: every card while posts load, then tracked
   * posts, and the creator's untracked video posts.
   *
   * @param card - The post card
   * @param postId - The post id, if found
   * @param pageUrl - The page's URL
   * @returns True if the card gets a panel
   */
  private wantsPanel(card: HTMLElement, postId: string | undefined, pageUrl: string): boolean {
    if (postId === undefined) {
      return false;
    }

    if (this.posts === null || this.posts.has(postId)) {
      return true;
    }

    return this.creator !== "" && hasVideo(card) && isCreatorPost(card, this.creator, pageUrl);
  }

  /**
   * @description
   * Inserts a panel host into a card and registers it.
   *
   * @param card - The post card
   * @param postId - The post id
   * @param post - The tracked post, or null while loading or untracked
   * @param untracked - Whether the post is known not to be tracked
   */
  private mount(card: HTMLElement, postId: string, post: Post | null, untracked: boolean): void {
    const host = document.createElement("div");

    host.setAttribute(HOST_ATTRIBUTE, "");
    host.className = "kol-pt-embed";
    insertAt(getMountPoint(card), host);

    this.styleCard(card, post !== null);
    this.registry.set({ key: `${postId}-${++this.sequence}`, card, host, postId, post, untracked });
  }

  /**
   * @description
   * Removes a panel host from its card and unregisters it.
   *
   * @param embed - The panel
   */
  private unmount(embed: ICardEmbed): void {
    embed.host.remove();
    this.styleCard(embed.card, false);
    this.registry.delete(embed.card);
  }

  /**
   * @description
   * Highlights or un-highlights a tracked card.
   *
   * @param card - The post card
   * @param tracked - Whether the card is tracked
   */
  private styleCard(card: HTMLElement, tracked: boolean): void {
    card.style.borderRadius = tracked ? TRACKED_CARD_STYLE.borderRadius : "";
    card.style.boxShadow = tracked ? TRACKED_CARD_STYLE.boxShadow : "";
  }
}
