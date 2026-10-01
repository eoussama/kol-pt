import { readFileSync } from "node:fs";

import { defineConfig } from "wxt";



const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };

const PATREON_MATCH = "https://www.patreon.com/*";

const ICONS = {
  16: "icons/icon16x16.png",
  32: "icons/icon32x32.png",
  48: "icons/icon48x48.png",
  128: "icons/icon128x128.png",
};

export default defineConfig({
  srcDir: "src",
  imports: false,
  modules: ["@wxt-dev/module-react"],
  manifestVersion: 3,
  targetBrowsers: ["chrome", "edge", "firefox", "safari"],
  webExt: {
    disabled: true,
  },
  zip: {
    includeSources: [".env.example", ".nvmrc"],
    excludeSources: ["html.txt", "build/**", "coverage/**"],
  },
  vite: () => ({
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
  }),
  manifest: ({ browser }) => ({
    name: "KOL Patreon Tracker",
    short_name: "KOL PT",
    description: "Track KingOfLightning (KOL) reactions on Patreon. KOL is an Anime/Manga YouTuber who covers One Piece and other content.",
    icons: ICONS,
    action: {
      default_title: "KOL Patreon Tracker",
      default_icon: ICONS,
    },
    permissions: ["storage", "webNavigation"],
    host_permissions: [PATREON_MATCH],
    web_accessible_resources: [
      {
        resources: ["images/platforms/*.png", "images/graphs/*.png", "images/graphs/*.svg"],
        matches: [PATREON_MATCH],
      },
    ],
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          id: "kol-pt@ouss.es",
          strict_min_version: "140.0",
          data_collection_permissions: {
            required: ["authenticationInfo"],
          },
        },
        gecko_android: {
          strict_min_version: "142.0",
        },
      },
    }),
    ...(browser === "safari" && {
      browser_specific_settings: {
        safari: {
          strict_min_version: "17.0",
        },
      },
    }),
  }),
});
