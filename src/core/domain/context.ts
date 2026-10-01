import type { TYouTubeContext } from "../schemas/tag/tag.schema";



/**
 * @description
 * Reads the YouTube-specific fields of a tag's free-form context. Values of
 * the wrong type are ignored.
 *
 * @param context - The tag's context
 * @returns The YouTube context fields that are present
 */
export function readYouTubeContext(context: Record<string, unknown> | undefined): TYouTubeContext {
  const { title, videoId, altTitles } = context ?? {};

  return {
    title: typeof title === "string" ? title : undefined,
    videoId: typeof videoId === "string" ? videoId : undefined,
    altTitles: Array.isArray(altTitles) ? altTitles.filter((alt): alt is string => typeof alt === "string") : undefined,
  };
}
