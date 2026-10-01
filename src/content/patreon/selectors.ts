/**
 * @description
 * Every hook into Patreon's markup lives here. Patreon's class names are
 * hashed CSS-module / styled-components names that change on every deploy,
 * so only `data-tag` attributes, ids and ARIA labels are used.
 *
 * Verified against the creator feed (`/cw/<creator>/posts`) markup of
 * October 2026.
 */
export const PatreonSelectors = {
  /**
   * @description
   * One post in a feed, or the post on a single post page.
   */
  card: "[data-tag=\"post-card\"]",

  /**
   * @description
   * Links whose `href` ends with the post's numeric id, in order of reliability.
   */
  postLinks: [
    "a[data-tag=\"post-published-at\"]",
    "[data-tag=\"post-title\"] a",
  ],

  /**
   * @description
   * The comment box, whose id is `comment-section-input-<postId>`.
   */
  commentInput: "[id^=\"comment-section-input-\"]",

  /**
   * @description
   * Markers only present on posts the viewer cannot access.
   */
  locked: [
    "[data-tag=\"locked-image-thumbnail\"]",
    "[data-tag=\"paywall-blur\"]",
    "[data-tag=\"locked-badge-button\"]",
    "[data-tag=\"teaser-post-content\"]",
  ].join(", "),

  /**
   * @description
   * Where the reactions panel goes inside a card, in order of preference.
   */
  anchors: {
    tags: "[data-tag=\"post-tags\"]",
    details: "[data-tag=\"post-details\"]",
    content: "div.patreon-post-content",
  },

  /**
   * @description
   * Patreon's native video player.
   */
  player: {
    root: "[role=\"application\"]",
    video: "video",
    playButton: "button[aria-label=\"Play\"]",
  },

  /**
   * @description
   * Legacy embedded (Vimeo) players.
   */
  iframe: "iframe",
} as const;

/**
 * @description
 * Attribute set on every element the extension inserts into the page,
 * so the card watcher can ignore our own mutations.
 */
export const HOST_ATTRIBUTE = "data-kol-pt-host";
