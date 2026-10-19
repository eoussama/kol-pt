import type { IPostDetails } from "../../core/schemas/api/patreon-post.schema";

import { PatreonPostSchema } from "../../core/schemas/api/patreon-post.schema";



/**
 * @description
 * How long to wait for Patreon, in milliseconds.
 */
const TIMEOUT_MS = 8000;

/**
 * @description
 * Gets when a post was published, and its thumbnail, from the Patreon API.
 * Both are public, locked posts included.
 *
 * @param postId - Patreon's numeric id of the post
 * @returns Promise resolving to what is known, nothing on failure
 */
export async function getPatreonPostDetails(postId: string): Promise<IPostDetails> {
  const unknown: IPostDetails = { publishedAt: null, thumbnail: null };

  try {
    const response = await fetch(`https://www.patreon.com/api/posts/${postId}?fields[post]=published_at,image`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const parsed = PatreonPostSchema.safeParse((await response.json())?.data?.attributes);

    if (!response.ok || !parsed.success) {
      return unknown;
    }

    const publishedAt = parsed.data.published_at ? Date.parse(parsed.data.published_at) : Number.NaN;
    const thumbnail = parsed.data.image?.large_url ?? parsed.data.image?.url ?? null;

    return {
      publishedAt: Number.isFinite(publishedAt) ? publishedAt : null,
      thumbnail: thumbnail?.startsWith("https://") ? thumbnail : null,
    };
  }
  catch {
    return unknown;
  }
}
