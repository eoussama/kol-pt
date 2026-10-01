/**
 * @description
 * Returns the shortest non-empty string of a list, without reordering it.
 *
 * @param values - The candidates
 * @param fallback - Returned when there is no candidate
 * @returns The shortest string, or the fallback
 */
export function shortest(values: ReadonlyArray<string>, fallback: string = ""): string {
  return values
    .filter(value => value.length > 0)
    .reduce<string | null>((best, value) => best === null || value.length < best.length ? value : best, null) ?? fallback;
}
