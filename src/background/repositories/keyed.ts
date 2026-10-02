import { normalizeList } from "../../core/schemas/primitives.schema";
import { toDatabaseKey } from "../../core/utils/watchlist";



/**
 * @description
 * A database object.
 */
type TNode = Record<string, unknown>;

/**
 * @description
 * Whether a value is a database object.
 *
 * @param value - Any value
 * @returns True for plain objects
 */
function isNode(value: unknown): value is TNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @description
 * The key an item is stored under once keyed: its id, made database safe.
 *
 * @param item - The item
 * @returns The key, or null if the item has no id
 */
function keyOf(item: TNode): string | null {
  const { id } = item;

  return typeof id === "string" || typeof id === "number" ? toDatabaseKey(String(id)) : null;
}

/**
 * @description
 * Rewrites a list stored as an array (or keyed by anything) as an object
 * keyed by each item's id, so items can be written one at a time. Items are
 * kept as they are, unknown fields included; items without an id are dropped,
 * as readers ignore them anyway.
 *
 * @param value - The raw database list
 * @param nested - A child list of each item to key as well, e.g. a post's tags
 * @returns The keyed list
 */
export function toKeyed(value: unknown, nested?: string): Record<string, TNode> {
  const keyed: Record<string, TNode> = {};

  for (const item of normalizeList(value)) {
    const key = isNode(item) ? keyOf(item) : null;

    if (isNode(item) && key !== null) {
      keyed[key] = nested && item[nested] != null ? { ...item, [nested]: toKeyed(item[nested]) } : item;
    }
  }

  return keyed;
}

/**
 * @description
 * Whether a list is already keyed by its items' ids.
 *
 * @param value - The raw database list
 * @param nested - A child list of each item that must be keyed as well
 * @returns True if every item is stored under its own id
 */
export function isKeyed(value: unknown, nested?: string): boolean {
  if (value == null) {
    return true;
  }

  if (!isNode(value)) {
    return false;
  }

  return Object.entries(value).every(([key, item]) => isNode(item)
    && keyOf(item) === key
    && (!nested || isKeyed(item[nested])));
}

/**
 * @description
 * Drops the `undefined` fields the database refuses.
 *
 * @param value - The value to write
 * @returns The value without undefined fields
 */
export function withoutUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
