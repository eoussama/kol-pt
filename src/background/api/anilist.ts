import type { TAnimeInfo } from "../../core/schemas/api/anime-info.schema";

import { AniListResponseSchema } from "../../core/schemas/api/anilist-response.schema";



/**
 * @description
 * How long to wait for AniList, in milliseconds.
 */
const TIMEOUT_MS = 8000;

/**
 * @description
 * The details asked for, by AniList ID or, when it is unknown, MyAnimeList ID.
 */
const QUERY = `query ($id: Int, $idMal: Int) {
  Media(id: $id, idMal: $idMal, type: ANIME) {
    title { romaji english native }
    description(asHtml: false)
    genres
    coverImage { extraLarge large }
  }
}`;

/**
 * @description
 * Turns AniList's description, which keeps some HTML, into plain text.
 *
 * @param description - The description
 * @returns The plain text
 */
export function toPlainText(description: string): string {
  return description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * @description
 * Gets an anime's details from AniList.
 *
 * @param ids - The anime's AniList ID, or its MyAnimeList ID
 * @param ids.anilistId - The anime's AniList ID
 * @param ids.malId - The anime's MyAnimeList ID, used without an AniList ID
 * @returns Promise resolving to the anime's details, or null if AniList has none or does not answer
 */
export async function getAniListInfo(ids: { anilistId?: number; malId?: number }): Promise<TAnimeInfo | null> {
  const variables = ids.anilistId ? { id: ids.anilistId } : ids.malId ? { idMal: ids.malId } : null;

  if (!variables) {
    return null;
  }

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: QUERY, variables }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const parsed = AniListResponseSchema.safeParse((await response.json())?.data?.Media);

    if (!response.ok || !parsed.success) {
      return null;
    }

    const anime = parsed.data;
    const photo = anime.coverImage.extraLarge ?? anime.coverImage.large;

    if (!photo) {
      return null;
    }

    return {
      description: toPlainText(anime.description ?? ""),
      genres: anime.genres,
      photo,
      altTitles: [anime.title.romaji, anime.title.english, anime.title.native]
        .map(title => ({ title: title ?? "", official: true })),
    };
  }
  catch {
    return null;
  }
}
