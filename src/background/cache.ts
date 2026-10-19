import type { WxtStorageItem } from "wxt/utils/storage";
import type { ICached, TKeyedCache } from "../core/storage/items";



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

/**
 * @description
 * Returns values kept by key from their cache while fresh, and loads the
 * missing or expired ones together, caching what was found. Keys the loader
 * does not find are not cached, so they are asked for again next time. If
 * loading fails, stale values are returned for the keys that have any.
 *
 * @param item - The cache entry, by key
 * @param keys - The keys wanted
 * @param load - Loads the values of the keys given, leaving out those it cannot find
 * @param options - Override the age limit, or the clock in tests
 * @param options.ttlMs - How long cached values stay fresh
 * @param options.now - The current time
 * @returns Promise resolving to the values found, by key
 */
export async function cachedEach<T>(
  item: WxtStorageItem<TKeyedCache<T>, Record<string, unknown>>,
  keys: ReadonlyArray<string>,
  load: (keys: Array<string>) => Promise<Map<string, T>>,
  options: { ttlMs?: number; now?: () => number } = {},
): Promise<Map<string, T>> {
  const { ttlMs = CACHE_TTL_MS, now = Date.now } = options;
  const current = await item.getValue();
  const found = new Map<string, T>();
  const missing: Array<string> = [];

  for (const key of new Set(keys)) {
    const entry = current[key];

    if (entry && now() - entry.updatedAt < ttlMs) {
      found.set(key, entry.data);
    }
    else {
      missing.push(key);
    }
  }

  if (missing.length === 0) {
    return found;
  }

  const loaded = await load(missing).catch(() => new Map<string, T>());

  missing.forEach((key) => {
    const stale = current[key];

    if (!loaded.has(key) && stale) {
      found.set(key, stale.data);
    }
  });

  if (loaded.size > 0) {
    // Read again, as other requests may have cached values meanwhile, and
    // drop what has expired so the cache does not grow forever
    const latest = await item.getValue();
    const kept = Object.entries(latest).filter(([, entry]) => now() - entry.updatedAt < ttlMs);
    const added = [...loaded].map(([key, data]) => [key, { updatedAt: now(), data }] as const);

    await item.setValue(Object.fromEntries([...kept, ...added]));
    loaded.forEach((data, key) => found.set(key, data));
  }

  return found;
}
