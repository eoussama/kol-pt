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

export { toNumericPostId } from "../../core/utils/post-id";

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
 * Finds the element to place the panel before, for a like/comment row: its
 * outermost wrapper that holds nothing else. The row itself sits in nested
 * single-child wrappers, and putting the panel inside them lays it over the
 * row's buttons.
 *
 * @param details - The like/comment row
 * @param card - The post card element
 * @returns The element to insert before
 */
function outermostWrapper(details: Element, card: Element): Element {
  let element = details;

  while (element.parentElement && element.parentElement !== card && element.parentElement.children.length === 1) {
    element = element.parentElement;
  }

  return element;
}

/**
 * @description
 * Finds where the reactions panel goes inside a card: below the post's tags,
 * otherwise below the post body, otherwise above the card's last like/comment
 * row (a card has another beside its title), otherwise at the end.
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

  const contentEl = card.querySelector(content);

  if (contentEl) {
    return { anchor: contentEl, position: "after" };
  }

  const detailsEl = Array.from(card.querySelectorAll(details)).at(-1);

  if (detailsEl) {
    return { anchor: outermostWrapper(detailsEl, card), position: "before" };
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

/**
 * @description
 * Whether a card holds a video, or a player that will load one.
 *
 * @param card - The post card
 * @returns True if it shows a video
 */
export function hasVideo(card: Element): boolean {
  return card.querySelector(PatreonSelectors.media) !== null;
}

/**
 * @description
 * Whether a card is the given creator's post: it links to the creator's
 * page, or the page itself is theirs.
 *
 * @param card - The post card
 * @param creator - The creator's Patreon handle
 * @param pageUrl - The page's URL
 * @returns True for the creator's posts
 */
export function isCreatorPost(card: Element, creator: string, pageUrl: string): boolean {
  const handle = creator.toLowerCase();
  const isCreatorPath = (url: string): boolean => {
    try {
      const [first, second] = new URL(url, pageUrl).pathname.toLowerCase().split("/").filter(Boolean);

      return first === handle || ((first === "c" || first === "cw") && second === handle);
    }
    catch {
      return false;
    }
  };

  return isCreatorPath(pageUrl) || Array.from(card.querySelectorAll("a[href]")).some(link => isCreatorPath(link.getAttribute("href") ?? ""));
}

/**
 * @description
 * Reads what a card shows about its post, to start tracking it from.
 *
 * @param card - The post card
 * @param postId - Patreon's numeric id of the post
 * @param pageUrl - The page's URL, which names the post on its own page
 * @returns The post's id (its URL slug when known), title and description
 */
export function readPostDetails(card: Element, postId: string, pageUrl = ""): { id: string; title: string; description: string } {
  const links = [
    ...PatreonSelectors.postLinks.map(selector => card.querySelector(selector)?.getAttribute("href")),
    pageUrl,
  ];
  const slug = links
    .map(href => href ? /\/posts\/([^/?#]+)/.exec(href)?.[1] : undefined)
    .find(segment => segment !== undefined && getPostIdFromUrl(`/posts/${segment}`) === postId);

  // innerText keeps paragraphs apart; jsdom only has textContent
  const text = (selector: string, keepLines = false) => {
    const element = card.querySelector<HTMLElement>(selector);
    // eslint-disable-next-line unicorn/prefer-dom-node-text-content -- textContent runs paragraphs together
    const raw = (keepLines ? element?.innerText : undefined) ?? element?.textContent ?? "";

    return keepLines
      ? raw.split("\n").map(line => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n")
      : raw.replace(/\s+/g, " ").trim();
  };

  return {
    id: slug ? decodeURIComponent(slug) : postId,
    title: text(PatreonSelectors.title),
    description: text(PatreonSelectors.anchors.content, true).slice(0, 5000),
  };
}
