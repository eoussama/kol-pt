import { fakeBrowser } from "wxt/testing/fake-browser";
import {
  animeInfoCacheItem,
  authUserItem,
  channelInfoCacheItem,
  coversCacheItem,
  entriesCacheItem,
  favoritesItem,
  moderatorItem,
  patreonColorModeItem,
  postsCacheItem,
  progressItem,
  reportsItem,
  watchlistItem,
} from "./items";



const items = [
  ["auth-user", authUserItem],
  ["watchlist", watchlistItem],
  ["favorites", favoritesItem],
  ["progress", progressItem],
  ["moderator", moderatorItem],
  ["reports", reportsItem],
  ["patreon-color-mode", patreonColorModeItem],
  ["cache-posts", postsCacheItem],
  ["cache-entries", entriesCacheItem],
  ["cache-anime-info", animeInfoCacheItem],
  ["cache-channel-info", channelInfoCacheItem],
  ["cache-covers", coversCacheItem],
] as const;

describe("storage items", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it.each(items)("keeps %s under its own key in local storage", async (key, item) => {
    await item.setValue({ marker: key } as never);

    expect(await fakeBrowser.storage.local.get(null)).toEqual({ [key]: { marker: key } });
  });

  it.each(items.filter(([, item]) => item.fallback === null))("has nothing for %s until it is written", async (_key, item) => {
    expect(await item.getValue()).toBeNull();
  });

  it.each([["cache-anime-info", animeInfoCacheItem], ["cache-channel-info", channelInfoCacheItem], ["cache-covers", coversCacheItem]] as const)("has an empty cache for %s until it is written", async (_key, item) => {
    expect(await item.getValue()).toEqual({});
  });
});
