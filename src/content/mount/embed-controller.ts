import type { Post } from "../../core/models/post.model";
import type { CardRegistry, ICardEmbed } from "./card-registry";

import { findCards, getMountPoint, insertAt, resolveCards } from "../patreon/post-card";
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
   */
  constructor(
    private readonly registry: CardRegistry,
    private readonly root: ParentNode = document,
    private readonly getPageUrl: () => string = () => window.location.href,
  ) { }

  /**
   * @description
   * Sets the tracked posts and updates the page.
   *
   * @param posts - Every tracked post
   */
  setPosts(posts: Array<Post>): void {
    this.posts = new Map(posts.map(post => [post.id, post]));
    this.sync();
  }

  /**
   * @description
   * Brings the mounted panels in line with the cards on the page.
   */
  sync(): void {
    const resolved = resolveCards(findCards(this.root), this.getPageUrl());

    for (const embed of this.registry.values()) {
      const postId = resolved.get(embed.card);

      if (!embed.card.isConnected || postId !== embed.postId || this.isUntracked(postId)) {
        this.unmount(embed);
      }
    }

    for (const [card, postId] of resolved) {
      if (this.isUntracked(postId)) {
        continue;
      }

      const post = this.posts?.get(postId) ?? null;
      const existing = this.registry.get(card);

      if (!existing) {
        this.mount(card, postId, post);

        continue;
      }

      // Patreon may re-render the card's content and drop the panel
      if (!existing.host.isConnected) {
        insertAt(getMountPoint(card), existing.host);
      }

      if (existing.post !== post) {
        this.registry.set({ ...existing, post });
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
   * Whether a post is known not to be tracked. Before posts have loaded,
   * nothing is.
   *
   * @param postId - The post id
   * @returns True if posts have loaded and this one is not among them
   */
  private isUntracked(postId: string | undefined): boolean {
    return postId === undefined || (this.posts !== null && !this.posts.has(postId));
  }

  /**
   * @description
   * Inserts a panel host into a card and registers it.
   *
   * @param card - The post card
   * @param postId - The post id
   * @param post - The tracked post, or null while loading
   */
  private mount(card: HTMLElement, postId: string, post: Post | null): void {
    const host = document.createElement("div");

    host.setAttribute(HOST_ATTRIBUTE, "");
    host.className = "kol-pt-embed";
    insertAt(getMountPoint(card), host);

    this.styleCard(card, post !== null);
    this.registry.set({ key: `${postId}-${++this.sequence}`, card, host, postId, post });
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
