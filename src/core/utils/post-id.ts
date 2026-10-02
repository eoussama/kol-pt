/**
 * @description
 * Reduces a post id to Patreon's numeric id: `anime-tonight-4-81910896`
 * and `81910896` are the same post.
 *
 * @param id - The post id, a URL slug or numeric
 * @returns The numeric id, or the id itself if it has none
 */
export function toNumericPostId(id: string): string {
  return /(?:^|-)(\d+)$/.exec(id)?.[1] ?? id;
}
