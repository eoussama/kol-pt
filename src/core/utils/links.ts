import { appConfig } from "../../config/app";



/**
 * @description
 * Opens an external page in a new tab, without giving it access to this page.
 *
 * @param url - The page to open
 */
export function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * @description
 * Opens the project's GitHub page.
 */
export function openProject(): void {
  openExternal("https://github.com/EOussama/kol-pt");
}

/**
 * @description
 * Opens KOL's Discord server.
 */
export function openDiscord(): void {
  openExternal("https://discord.com/invite/5zGuUpwH3K");
}

/**
 * @description
 * Opens the Passione Club channel of KOL's Discord server.
 */
export function openPassione(): void {
  openExternal("https://discord.com/channels/177656523135254529/823055567064530954");
}

/**
 * @description
 * Opens the creator's Patreon page.
 */
export function openPatreon(): void {
  const { patreonUrl, creatorName } = appConfig;

  openExternal(`${patreonUrl}/${creatorName}`);
}

/**
 * @description
 * Opens a Patreon post, optionally positioned at one of its reactions or at
 * a saved position.
 *
 * @param postId - The post's ID
 * @param reactionId - The reaction (tag) to position the video at
 * @param resumeAt - The position to resume at, in seconds; wins over the reaction
 */
export function openPost(postId: string, reactionId?: string, resumeAt?: number): void {
  const url = new URL(`${appConfig.patreonUrl}/posts/${encodeURIComponent(postId)}`);

  if (reactionId) {
    url.searchParams.set("reactionId", reactionId);
  }

  if (resumeAt !== undefined) {
    url.searchParams.set("resumeAt", String(Math.floor(resumeAt)));
  }

  openExternal(url.href);
}

/**
 * @description
 * Opens a title on IMDb.
 *
 * @param imdbId - The IMDb ID
 */
export function openIMDb(imdbId: string): void {
  openExternal(`https://www.imdb.com/title/${encodeURIComponent(imdbId)}`);
}

/**
 * @description
 * Opens an anime on MyAnimeList.
 *
 * @param malId - The MyAnimeList ID
 */
export function openMAL(malId: number): void {
  openExternal(`https://myanimelist.net/anime/${malId}`);
}

/**
 * @description
 * Opens an anime on AniList.
 *
 * @param anilistId - The AniList ID
 */
export function openAniList(anilistId: number): void {
  openExternal(`https://anilist.co/anime/${anilistId}`);
}

/**
 * @description
 * Opens an anime on Kitsu.
 *
 * @param kitsuId - The Kitsu ID
 */
export function openKitsu(kitsuId: string): void {
  openExternal(`https://kitsu.io/anime/${encodeURIComponent(kitsuId)}`);
}

/**
 * @description
 * Opens a YouTube video.
 *
 * @param videoId - The video's ID
 */
export function openYouTubeVideo(videoId: string): void {
  openExternal(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`);
}

/**
 * @description
 * Opens a YouTube channel.
 *
 * @param handle - The channel's handle, without the @
 */
export function openYouTubeChannel(handle: string): void {
  openExternal(`https://www.youtube.com/@${encodeURIComponent(handle)}`);
}
