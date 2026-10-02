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
 * A watched reaction.
 */
export interface IWatchlistEntry {

  /**
   * @description
   * The reaction's watchlist key, `<postId>/<tagId>`.
   */
  key: string;

  /**
   * @description
   * When it was marked watched, in epoch milliseconds, or null for reactions
   * marked before dates were recorded.
   */
  watchedAt: number | null;
}

/**
 * @description
 * Reads a watchlist as stored in the database, `{ postId: { tagId: when } }`,
 * where `when` is the time it was watched, or `true` for reactions marked
 * before dates were recorded. The database SDK returns an object whose keys
 * are small integers as an array (`{ 1: true }` reads as `[, true]`), so
 * arrays are read by index. Anything else reads as empty.
 *
 * @param value - The raw database value
 * @returns The watched reactions
 */
export function readWatchlistEntries(value: unknown): Array<IWatchlistEntry> {
  const entries = (node: unknown): Array<[string, unknown]> =>
    node && typeof node === "object" ? Object.entries(node) : [];

  return entries(value).flatMap(([postId, tags]) => entries(tags).flatMap(([tagId, watched]): Array<IWatchlistEntry> => {
    const key = `${postId}/${tagId}`;

    if (watched === true) {
      return [{ key, watchedAt: null }];
    }

    return typeof watched === "number" && Number.isFinite(watched) && watched > 0 ? [{ key, watchedAt: watched }] : [];
  }));
}

/**
 * @description
 * Reads the keys of a watchlist as stored in the database.
 *
 * @param value - The raw database value
 * @returns The watched reactions' keys
 */
export function readWatchlist(value: unknown): Array<string> {
  return readWatchlistEntries(value).map(entry => entry.key);
}
