import type { THandlers } from "./messaging/server";

import { getAnimeInfo } from "./api/jikan";
import { getChannelInfo } from "./api/youtube";
import { requireUser, signInWithGoogleToken, signOutUser, toAuthUser } from "./auth";
import { fetchImageAsDataUrl } from "./images";
import { isExtensionPage } from "./messaging/server";
import { getEntries, getPostsWithEntries } from "./repositories/content";
import { deletePost, deleteTag, isModerator, refreshModerator, saveEntry, savePost, saveTag } from "./repositories/moderation";
import { setProgress } from "./repositories/progress";
import { clearReports, createReport, loadReports, resolveReport } from "./repositories/reports";
import { getSettings, updateSettings } from "./repositories/settings";
import { favorites, setWatched } from "./repositories/watchlist";



/**
 * @description
 * Ensures the signed-in user is a moderator. The database rules check the
 * same; this only fails early with a clear message.
 *
 * @returns Promise resolving to the moderator's ID
 */
async function requireModerator(): Promise<string> {
  const { uid } = await requireUser();

  if (!(await isModerator(uid))) {
    throw new Error("Only moderators can do this");
  }

  return uid;
}

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

  "progress.set": async ({ postId, time }) => {
    await setProgress((await requireUser()).uid, postId, time);

    return null;
  },

  "moderation.refresh": async () => {
    const { uid } = await requireUser();
    const moderator = await refreshModerator(uid);

    await (moderator ? loadReports(uid) : clearReports());

    return { moderator };
  },

  "posts.save": async ({ post }) => {
    await requireModerator();

    return savePost(post);
  },

  "posts.delete": async ({ postId }) => {
    await requireModerator();

    return deletePost(postId);
  },

  "tags.save": async ({ postId, tag }) => {
    await requireModerator();

    return saveTag(postId, tag);
  },

  "tags.delete": async ({ postId, tagId }) => {
    await requireModerator();

    return deleteTag(postId, tagId);
  },

  "entries.save": async ({ entry }) => {
    await requireModerator();

    return saveEntry(entry);
  },

  "reports.create": async ({ report }) => {
    await createReport(toAuthUser(await requireUser()), report);

    return null;
  },

  "reports.resolve": async ({ reportId }) => {
    await resolveReport(await requireModerator(), reportId);

    return null;
  },
};
