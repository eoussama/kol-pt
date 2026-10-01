/**
 * @description
 * Characters the Realtime Database does not allow in keys.
 */
const INVALID_KEY_CHARS = /[.#$/[\]]/g;

/**
 * @description
 * Makes an id safe to use as a Realtime Database key.
 *
 * @param id - The id
 * @returns The id with forbidden characters replaced
 */
export function toDatabaseKey(id: string): string {
  return id.replace(INVALID_KEY_CHARS, "_");
}

/**
 * @description
 * Identifies a reaction across posts, as stored in the watchlist:
 * `<postId>/<tagId>`.
 *
 * @param postId - The post's ID
 * @param tagId - The reaction's (tag's) ID
 * @returns The watchlist key
 */
export function watchlistKey(postId: string, tagId: string): string {
  return `${toDatabaseKey(postId)}/${toDatabaseKey(tagId)}`;
}

/**
 * @description
 * Reads a watchlist as stored in the database, `{ postId: { tagId: true } }`,
 * into a list of watchlist keys. Anything else reads as an empty list.
 *
 * @param value - The raw database value
 * @returns The watched reactions' keys
 */
export function readWatchlist(value: unknown): Array<string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([postId, tags]) =>
    tags && typeof tags === "object" && !Array.isArray(tags)
      ? Object.entries(tags as Record<string, unknown>)
          .filter(([, watched]) => watched === true)
          .map(([tagId]) => `${postId}/${tagId}`)
      : [],
  );
}
