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
 * into a list of watchlist keys. The database SDK returns an object whose
 * keys are small integers as an array (`{ 1: true }` reads as
 * `[, true]`), so arrays are read by index. Anything else reads as empty.
 *
 * @param value - The raw database value
 * @returns The watched reactions' keys
 */
export function readWatchlist(value: unknown): Array<string> {
  const entries = (node: unknown): Array<[string, unknown]> =>
    node && typeof node === "object" ? Object.entries(node) : [];

  return entries(value).flatMap(([postId, tags]) => entries(tags)
    .filter(([, watched]) => watched === true)
    .map(([tagId]) => `${postId}/${tagId}`));
}
