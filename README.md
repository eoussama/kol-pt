# KOL Patreon Tracker

KOL Patreon Tracker is a browser extension for Chrome, Edge, Firefox and Safari that helps you find KingOfLightning (KOL) reactions on Patreon.
KOL is an Anime/Manga YouTuber who mostly does One Piece content and other reactions and theories.

Patreon has started taking down copyrighted content, so KOL stopped naming the shows he reacts to in his posts.
This extension shows what each stream reacts to, and when, so you can jump straight to a reaction in streams that can run for over six hours.

## Features

- **Reactions on Patreon:** every tracked post on KOL's Patreon gets a panel listing its reactions, with what is being reacted to, when it starts and how long it lasts.
- **Jump to a reaction:** start the post's video at any reaction from the panel.
- **Details and links:** see a show's synopsis, genres and alternative titles, and open it on MyAnimeList, AniList, Kitsu, IMDb or YouTube.
- **Watched reactions:** sign in to tick off the reactions you have watched, kept across devices and browser tabs.
- **Report problems:** signed-in viewers can flag a wrong timestamp, a wrong show or episode, a missing reaction, or a video post that is not tracked yet.
- **Moderation:** moderators add, edit and remove reactions and shows from the panel under each post, track new posts, and work through reports from the popup's Reports tab.
- **Browse from the toolbar:** the extension's popup lists every tracked stream and every show, searchable, and opens a stream at a given reaction.

## Usage

1. Go to [KOL's Patreon posts](https://www.patreon.com/cw/KingOfLightning/posts).
2. Tracked posts are highlighted and show a reactions panel under their tags.
3. Click a reaction's start time, or its play button, to start the video there.
4. Click the extension's icon in the toolbar to browse streams and shows, or to sign in with Google so you can mark reactions as watched.

You need access to KOL's posts on Patreon to watch them; the extension does not unlock anything.

## Supported browsers

| Browser | Minimum version |
| --- | --- |
| Chrome and other Chromium browsers | 117 |
| Edge | 117 |
| Firefox (desktop) | 140 |
| Firefox for Android | 142 |
| Safari (macOS) | 17 |

## Building from source

Requirements: Node.js 24 (see `.nvmrc`) and pnpm 11 (`corepack enable` picks the version from `package.json`).

```sh
pnpm install
cp .env.example .env   # then fill in the Firebase and YouTube values
```

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm dev:firefox` | Development build with hot reload |
| `pnpm build` | Chrome build in `.output/chrome-mv3` |
| `pnpm build:edge`, `build:firefox`, `build:safari` | The other browsers, in `.output/<browser>-mv3` |
| `pnpm build:all` | All four builds |
| `pnpm zip:all` | Store-ready zips in `.output`, plus the Firefox sources zip |
| `pnpm test` / `pnpm lint` / `pnpm typecheck` | Checks |
| `pnpm prod` | Audit, lint, type-check, test and zip everything |

### Loading the build

- **Chrome / Edge:** open `chrome://extensions` (or `edge://extensions`), enable developer mode, choose *Load unpacked* and select `.output/chrome-mv3` (or `.output/edge-mv3`).
- **Firefox:** open `about:debugging#/runtime/this-firefox`, choose *Load Temporary Add-on* and select `.output/firefox-mv3/manifest.json`. Then allow the extension to access patreon.com from `about:addons` if Firefox has not granted it.
- **Safari:** on a Mac with Xcode, wrap the build in an app with `xcrun safari-web-extension-packager .output/safari-mv3` (`safari-web-extension-converter` on older Xcode versions), run the generated project, then enable the extension in Safari's settings (with *Allow unsigned extensions* in the Develop menu for local builds). Publishing requires an Apple Developer account.

### Configuration

| Variable | Purpose |
| --- | --- |
| `WXT_FIREBASE_*` | The Firebase web app that holds the tracked posts, entries and user data |
| `WXT_YOUTUBE_DATA_API_KEY` | YouTube channel details (optional) |
| `WXT_PATREON_URL`, `WXT_CREATOR_NAME` | The Patreon page to track |
| `WXT_FIREGUARD_URL` | The Fireguard sign-in page |

Variables are read at build time. Only the background script receives the Firebase configuration and the YouTube key; the script running on Patreon receives neither.

### Database rules and moderators

[`database.rules.json`](database.rules.json) holds the Realtime Database rules the extension expects. Merge them into your project's rules (Firebase console, Realtime Database, Rules):

- Anyone can read `posts` and `entries`; only moderators can change them.
- Each user reads and writes only their own `users/{uid}` (settings, watched, favorites, resume positions).
- Signed-in users can file one open report per reaction or post under `reports`; only moderators can read reports and close them.

To make someone a moderator, set `moderators/{their uid}` to `true` in the database. Their uid is listed under Authentication, Users. They get the moderation tools after signing in again or reopening the popup.

The first change a moderator makes rewrites `posts` and `entries` from arrays into objects keyed by id, so later changes touch one item at a time. The extension reads both shapes.

## How it works

- `src/entrypoints/patreon.content`: runs on patreon.com. It finds post cards through Patreon's stable `data-tag` attributes (`src/content/patreon/selectors.ts` owns every selector), inserts a panel into each tracked post, and drives Patreon's video player.
- `src/entrypoints/background.ts`: the only part that talks to Firebase and third-party APIs. Pages ask it for data through a typed request protocol (`src/core/messaging`), and it caches data in extension storage.
- `src/entrypoints/popup` and `src/entrypoints/auth`: the toolbar popup and the sign-in window.

If Patreon changes its markup again, start with `src/content/patreon/selectors.ts` and the fixture next to its tests.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

The KOL Patreon Tracker extension is not affiliated with or endorsed by KingOfLightning or Patreon. It is an independent project developed by fans for fans to enhance the experience of tracking KOL's reactions on Patreon.

## Privacy

See the [privacy policy](PRIVACY.md). It is also published at <https://github.com/EOussama/kol-pt/blob/main/PRIVACY.md>.

## Feedback and Support

If you have any feedback, questions, or issues with the KOL Patreon Tracker extension, please [open an issue](https://github.com/EOussama/kol-pt/issues/new/choose) on the project's GitHub repository.
