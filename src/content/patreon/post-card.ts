import { PatreonSelectors } from "./selectors";



/**
 * @description
 * Matches a Patreon post URL and captures its numeric id. Post URLs end with
 * `/posts/<slug>-<id>` or `/posts/<id>`, optionally followed by a slash, a
 * query string or a hash.
 */
const POST_URL_RGX = /\/posts\/(?:[^/?#]*-)?(\d+)\/?(?:[?#].*)?$/;

/**
 * @description
 * Matches the comment box id `comment-section-input-<postId>`.
 */
const COMMENT_INPUT_RGX = /^comment-section-input-(\d+)$/;

/**
 * @description
 * Where to insert the reactions panel relative to an anchor element.
 */
export type TMountPosition = "after" | "before" | "append";

/**
 * @description
 * The anchor element and position to insert the reactions panel at.
 */
export interface IMountPoint {
  anchor: Element;
  position: TMountPosition;
}

/**
 * @description
 * Reduces a stored post id to Patreon's numeric post id, which is what the
 * page exposes. The database stores posts by their URL slug
 * (`anime-tonight-2-78568944`); bare numeric ids are kept as they are.
 *
 * @param id - The stored post id
 * @returns The numeric post id, or the id unchanged if it has none
 */
export function toNumericPostId(id: string): string {
  return /(?:^|-)(\d+)$/.exec(id)?.[1] ?? id;
}

/**
 * @description
 * Extracts a post id from a Patreon post URL.
 *
 * @param url - An absolute or relative post URL
 * @returns The numeric post id, or null if the URL is not a post URL
 */
export function getPostIdFromUrl(url: string): string | null {
  return POST_URL_RGX.exec(url)?.[1] ?? null;
}

/**
 * @description
 * Resolves the Patreon post id of a post card from its own markup.
 *
 * @param card - The post card element
 * @returns The numeric post id, or null if the card does not expose one
 */
export function getPostId(card: Element): string | null {
  for (const selector of PatreonSelectors.postLinks) {
    const href = card.querySelector<HTMLAnchorElement>(selector)?.getAttribute("href");
    const id = href ? getPostIdFromUrl(href) : null;

    if (id) {
      return id;
    }
  }

  for (const element of card.querySelectorAll(PatreonSelectors.commentInput)) {
    const id = COMMENT_INPUT_RGX.exec(element.id)?.[1];

    if (id) {
      return id;
    }
  }

  return null;
}

/**
 * @description
 * Checks whether the viewer is locked out of a post.
 *
 * @param card - The post card element
 * @returns True if the post is locked
 */
export function isLocked(card: Element): boolean {
  return card.querySelector(PatreonSelectors.locked) !== null;
}

/**
 * @description
 * Finds where the reactions panel goes inside a card: below the post's tags,
 * otherwise above the like/comment row, otherwise below the post body.
 *
 * @param card - The post card element
 * @returns The anchor and position, always inside the card
 */
export function getMountPoint(card: Element): IMountPoint {
  const { tags, details, content } = PatreonSelectors.anchors;

  const tagsEl = card.querySelector(tags);

  if (tagsEl) {
    return { anchor: tagsEl, position: "after" };
  }

  const detailsEl = card.querySelector(details);

  if (detailsEl) {
    return { anchor: detailsEl, position: "before" };
  }

  const contentEl = card.querySelector(content);

  if (contentEl) {
    return { anchor: contentEl, position: "after" };
  }

  return { anchor: card, position: "append" };
}

/**
 * @description
 * Inserts an element at a mount point.
 *
 * @param point - The mount point
 * @param element - The element to insert
 */
export function insertAt(point: IMountPoint, element: Element): void {
  switch (point.position) {
    case "after":
      point.anchor.after(element);
      break;

    case "before":
      point.anchor.before(element);
      break;

    case "append":
      point.anchor.append(element);
      break;
  }
}

/**
 * @description
 * Lists the post cards under a root.
 *
 * @param root - Where to look
 * @returns The post card elements, in document order
 */
export function findCards(root: ParentNode): Array<HTMLElement> {
  return Array.from(root.querySelectorAll<HTMLElement>(PatreonSelectors.card));
}

/**
 * @description
 * Resolves the post id of every unlocked card on the page. On a post page
 * (`/posts/<id>`), a single card that does not expose its id gets the id from
 * the URL, unless another card already carries it.
 *
 * @param cards - The post cards on the page
 * @param pageUrl - The current page URL
 * @returns The unlocked cards mapped to their post ids
 */
export function resolveCards(cards: Array<HTMLElement>, pageUrl: string): Map<HTMLElement, string> {
  const resolved = new Map<HTMLElement, string>();
  const unresolved: Array<HTMLElement> = [];

  for (const card of cards) {
    if (isLocked(card)) {
      continue;
    }

    const id = getPostId(card);

    if (id) {
      resolved.set(card, id);
    }
    else {
      unresolved.push(card);
    }
  }

  const pageId = getPostIdFromUrl(pageUrl);
  const [onlyCard] = unresolved;

  if (pageId && onlyCard && unresolved.length === 1 && !Array.from(resolved.values()).includes(pageId)) {
    resolved.set(onlyCard, pageId);
  }

  return resolved;
}
