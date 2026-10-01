import type { TAnimeInfo } from "../schemas/api/anime-info.schema";
import type { TYouTubeInfo } from "../schemas/api/youtube-info.schema";
import type { TEntry } from "../schemas/entry/entry.schema";
import type { TPost } from "../schemas/post.schema";
import type { TSettings } from "../schemas/settings.schema";
import type { IAuthUser } from "../types/auth-user.type";



/**
 * @description
 * Marks the extension's own messages, so the background ignores anything else.
 */
export const MESSAGE_CHANNEL = "kol-pt";

/**
 * @description
 * Every request the background answers, with its payload and response.
 * The popup, the login window and the content script send these; only the
 * background talks to Firebase and third-party APIs.
 */
export interface IRequestMap {

  /**
   * @description
   * Tracked posts, with the entries their reactions refer to.
   */
  "posts.list": {
    payload: { force?: boolean };
    response: { posts: Array<TPost>; entries: Array<TEntry> };
  };

  /**
   * @description
   * Every entry.
   */
  "entries.list": {
    payload: { force?: boolean };
    response: Array<TEntry>;
  };

  /**
   * @description
   * An anime's details from MyAnimeList.
   */
  "anime.info": {
    payload: { malId: number };
    response: TAnimeInfo;
  };

  /**
   * @description
   * A YouTube channel's details.
   */
  "youtube.channel": {
    payload: { channelId: string };
    response: TYouTubeInfo;
  };

  /**
   * @description
   * An image as a data URL, for pages whose content security policy blocks it.
   */
  "images.fetch": {
    payload: { url: string };
    response: string | null;
  };

  /**
   * @description
   * Signs in with a Google ID token. Only accepted from extension pages.
   */
  "auth.signIn": {
    payload: { idToken: string };
    response: IAuthUser;
  };

  /**
   * @description
   * Signs out.
   */
  "auth.signOut": {
    payload: Record<never, never>;
    response: null;
  };

  /**
   * @description
   * The signed-in user's settings.
   */
  "settings.get": {
    payload: Record<never, never>;
    response: TSettings;
  };

  /**
   * @description
   * Updates the signed-in user's settings.
   */
  "settings.set": {
    payload: { settings: Partial<TSettings> };
    response: TSettings;
  };

  /**
   * @description
   * Marks one of the signed-in user's reactions as watched or not.
   * Responds with every watched reaction's key.
   */
  "watchlist.set": {
    payload: { postId: string; tagId: string; watched: boolean };
    response: Array<string>;
  };

  /**
   * @description
   * Marks one of the signed-in user's reactions as a favorite or not.
   * Responds with every favorite's key.
   */
  "favorites.set": {
    payload: { postId: string; tagId: string; favorite: boolean };
    response: Array<string>;
  };

  /**
   * @description
   * Saves where the signed-in user stopped watching a post, in seconds, or
   * forgets it (null).
   */
  "progress.set": {
    payload: { postId: string; time: number | null };
    response: null;
  };
}

/**
 * @description
 * The name of a request.
 */
export type TRequestType = keyof IRequestMap;

/**
 * @description
 * A request message, by name.
 */
export type TRequest<K extends TRequestType = TRequestType> = {
  [P in K]: { channel: typeof MESSAGE_CHANNEL; type: P } & IRequestMap[P]["payload"];
}[K];

/**
 * @description
 * The payload of a request, by name.
 */
export type TPayload<K extends TRequestType> = IRequestMap[K]["payload"];

/**
 * @description
 * The response to a request, by name.
 */
export type TResponse<K extends TRequestType> = IRequestMap[K]["response"];

/**
 * @description
 * What the background sends back: the response, or why it failed.
 */
export type TEnvelope<T> = { ok: true; data: T } | { ok: false; error: string };
