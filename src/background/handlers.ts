import type { THandlers } from "./messaging/server";

import { getAnimeInfo } from "./api/jikan";
import { getChannelInfo } from "./api/youtube";
import { requireUser, signInWithGoogleToken, signOutUser } from "./auth";
import { fetchImageAsDataUrl } from "./images";
import { isExtensionPage } from "./messaging/server";
import { getEntries, getPostsWithEntries } from "./repositories/content";
import { getSettings, updateSettings } from "./repositories/settings";
import { favorites, setWatched } from "./repositories/watchlist";



/**
 * @description
 * What the background does for each request.
 */
export const handlers: THandlers = {
  "posts.list": ({ force }) => getPostsWithEntries(force),

  "entries.list": ({ force }) => getEntries(force),

  "anime.info": ({ malId }) => getAnimeInfo(malId),

  "youtube.channel": ({ channelId }) => getChannelInfo(channelId),

  "images.fetch": ({ url }) => fetchImageAsDataUrl(url),

  "auth.signIn": async ({ idToken }, sender) => {
    if (!isExtensionPage(sender)) {
      throw new Error("Signing in is only allowed from the extension");
    }

    return signInWithGoogleToken(idToken);
  },

  "auth.signOut": async (_, sender) => {
    if (!isExtensionPage(sender)) {
      throw new Error("Signing out is only allowed from the extension");
    }

    await signOutUser();

    return null;
  },

  "settings.get": async () => getSettings((await requireUser()).uid),

  "settings.set": async ({ settings }) => updateSettings((await requireUser()).uid, settings),

  "watchlist.set": async ({ postId, tagId, watched }) => setWatched((await requireUser()).uid, postId, tagId, watched),

  "favorites.set": async ({ postId, tagId, favorite }) => setWatched((await requireUser()).uid, postId, tagId, favorite, Date.now, favorites),
};
