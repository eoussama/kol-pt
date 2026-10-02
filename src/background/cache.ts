import type { WxtStorageItem } from "wxt/utils/storage";
import type { ICached } from "../core/storage/items";



/**
 * @description
 * How long cached collections stay fresh, in milliseconds.
 */
export const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * @description
 * Returns a collection from its cache while fresh, otherwise loads it and
 * caches the result. Each collection has its own cache entry and age.
 * If loading fails, stale data is returned when there is any.
 *
 * @param item - The collection's cache entry
 * @param load - Loads the collection
 * @param options - Bypass the cache with `force`, override the age limit, or the clock in tests
 * @param options.force - Ignore fresh cached data
 * @param options.ttlMs - How long cached data stays fresh
 * @param options.now - The current time
 * @returns Promise resolving to the collection
 */
export async function cached<T>(
  item: WxtStorageItem<ICached<T> | null, Record<string, unknown>>,
  load: () => Promise<T>,
  options: { force?: boolean; ttlMs?: number; now?: () => number } = {},
): Promise<T> {
  const { force = false, ttlMs = CACHE_TTL_MS, now = Date.now } = options;
  const current = await item.getValue();

  if (!force && current && now() - current.updatedAt < ttlMs) {
    return current.data;
  }

  try {
    const data = await load();

    await item.setValue({ updatedAt: now(), data });

    return data;
  }
  catch (error) {
    if (current) {
      return current.data;
    }

    throw error;
  }
}
