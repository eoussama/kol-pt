import { config } from "../../../config/env";



/**
 * @description
 * Helps with navigation
 */
export class NavigationHelper {

  //#region Github

  /**
   * @description
   * Opens the project's Github page
   */
  static openProject(): void {
    window.open('https://github.com/EOussama/kol-pt', '_blank');
  }

  //#endregion

  //#region Discord

  /**
   * @description
   * Opens the Discord server page
   */
  static openDiscord(): void {
    window.open('https://discord.com/invite/5zGuUpwH3K', '_blank');
  }

  /**
   * @description
   * Opens the Discord passione club channel page
   */
  static openPassione(): void {
    window.open('https://discord.com/channels/177656523135254529/823055567064530954', '_blank');
  }

  //#endregion

  //#region Patreon

  /**
   * @description
   * Opens the creator's Patreon page
   */
  static openPatreon(): void {
    window.open(`${config.patreonUrl}/${config.creatorName}`, '_blank');
  }

  /**
   * @description
   * Opens a specific Patreon post
   *
   * @param postId The post's ID
   */
  static openPost(postId: string): void {
    window.open(`https://www.patreon.com/posts/${postId}`, '_blank');
  }

  /**
   * @description
   * Opens a specific Patreon post and skins to reaction
   *
   * @param postId The post's ID
   * @param reactionId The reaction's ID
   */
  static openReaction(postId: string, reactionId: string): void {
    window.open(`https://www.patreon.com/posts/${postId}?reactionId=${reactionId}`, '_blank');
  }

  //#endregion

  //#region Info

  /**
   * @description
   * Opens the IMDb page for the entry in a new window.
   *
   * @param imdbId The ID of the entry on IMDb.
   */
  static openIMDb(imdbId: string): void {
    window.open(`https://www.imdb.com/title/${imdbId}`, '_blank');
  }

  /**
   * @description
   * Opens the MyAnimeList page of the anime in a new tab.
   *
   * @param malId The MyAnimeList ID of the entry.
   */
  static openMAL(malId: number): void {
    window.open(`https://myanimelist.net/anime/${malId}`, '_blank');
  }

  /**
   * @description
   * Opens the AniList page of the anime in a new tab.
   *
   * @param anilistId The AniList ID of the entry.
   */
  static openAniList(anilistId: number): void {
    window.open(`https://anilist.co/anime/${anilistId}`, '_blank');
  }

  /**
   * @description
   * Opens the Kitsu page of the anime in a new tab.
   *
   * @param kitsuId The Kitsu ID of the entry.
   */
  static openKitsu(kitsuId: string): void {
    window.open(`https://kitsu.io/anime/${kitsuId}`, '_blank');
  }

  //#endregion

  //#region Stream

  /**
   * @description
   * Opens the Zoro.to page of the anime in a new tab.
   *
   * @param zoroId The ID of the entry on zoro.to.
   */
  static openZoro(zoroId: string): void {
    window.open(`https://zoro.to/watch/${zoroId}`, '_blank');
  }

  /**
   * @description
   * Opens the Zoro.to page of the anime in a new tab.
   *
   * @param zoroId The ID of anime on zoro.to.
   * @param episodeId The ID of the episode.
   */
  static openZoroEpisode(zoroId: string, episodeId: number): void {
    window.open(`https://zoro.to/watch/${zoroId}?ep=${episodeId}`, '_blank');
  }

  //#endregion

  //#region YouTube

  /**
   * @description
   * Opens YouTube video in a new tab.
   *
   * @param videoId The ID of the YouTube video
   */
  static openYoutubeVideo(videoId: string): void {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  }

  /**
   * @description
   * Opens YouTube channel in a new tab.
   *
   * @param channelId The handle ID of the channel
   */
  static openYoutubeChannel(channelId: string): void {
    window.open(`https://www.youtube.com/@${channelId}`, '_blank');
  }

  //#endregion
}