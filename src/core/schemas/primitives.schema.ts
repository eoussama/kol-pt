import { z } from "zod";



/**
 * @description
 * An identifier stored as a string or a number, read as a string.
 */
export const IdSchema = z.union([z.string(), z.number()]).transform(String);

/**
 * @description
 * A number stored as a number or a numeric string.
 */
export const NumberLikeSchema = z.union([z.number(), z.string()])
  .transform(Number)
  .pipe(z.number().finite());

/**
 * @description
 * A point in time stored as epoch milliseconds or a date string, read as
 * epoch milliseconds.
 */
export const TimestampSchema = z.union([z.number(), z.string()])
  .transform(value => typeof value === "number" ? value : Date.parse(value))
  .pipe(z.number().finite());

/**
 * @description
 * Text stored as a string or a number, read as a string.
 */
export const TextSchema = z.union([z.string(), z.number()]).transform(String);

/**
 * @description
 * Turns a Realtime Database list into an array. The database drops empty
 * arrays, stores sparse arrays as objects keyed by index, and leaves holes
 * as null.
 *
 * @param value - The raw value
 * @returns The list items, without holes
 */
export function normalizeList(value: unknown): Array<unknown> {
  if (Array.isArray(value)) {
    return value.filter(item => item != null);
  }

  if (value && typeof value === "object") {
    return Object.values(value).filter(item => item != null);
  }

  return [];
}

/**
 * @description
 * A list read with `normalizeList` where each item is validated on its own,
 * so one malformed item is dropped instead of failing the whole list.
 *
 * @param item - The schema of one item
 * @returns The list schema
 */
export function listOf<T extends z.ZodType>(item: T) {
  return z.unknown()
    .transform(value => normalizeList(value).flatMap((raw) => {
      const parsed = item.safeParse(raw);

      return parsed.success ? [parsed.data as z.output<T>] : [];
    }))
    // A missing key is an empty list: the database drops empty arrays
    .default([]);
}
