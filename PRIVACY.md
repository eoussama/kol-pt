# Privacy Policy

_Last updated: 2026-10-05_

This policy covers the **KOL Patreon Tracker** browser extension ("KOL PT", "the extension") for Chrome, Edge, Firefox and Safari. It is an independent, open-source project and is not affiliated with or endorsed by KingOfLightning or Patreon.

> The extension only collects what it needs to sync your watch progress across devices, it does not sell or share your data, and it has no ads, analytics or tracking.

## What the extension collects

### Account information
Signing in is optional and uses Google through Firebase Authentication. When you sign in, the extension receives and keeps:

- your email address
- your display name
- your profile picture URL
- your Firebase user ID

This information is used to show who is signed in and to tie your data to your account. We never see or receive your Google password.

### Your tracking data
While signed in, the extension stores the following, linked to your user ID:

- the reactions you marked as watched, and when
- the reactions you marked as favorites
- where you stopped watching each post (resume position)
- your settings (for example, compact or expanded view)

### Reports
If you report a problem with a post or entry, the report is stored with your user ID and display name, the post concerned, and the note you wrote (up to 500 characters). Reports are visible to you and to the extension's moderators.

### Stored in your browser
The extension keeps local copies in your browser's extension storage: the signed-in user, your tracking data, cached lists of tracked posts and entries, and Patreon's light/dark setting so the popup can match it. This stays on your device and is cleared when you uninstall the extension.

## What the extension does not collect

- No analytics, telemetry, crash reporting or advertising identifiers.
- No browsing history. The extension only runs on `patreon.com` pages and only reads the page elements needed to find posts from the tracked creator and to control the video player. Nothing from Patreon pages is sent anywhere, except the post identifiers you explicitly act on (marking watched, favoriting, resuming or reporting).
- No Patreon credentials or payment information.

## Where data is stored and who processes it

| Service | Purpose | Data involved |
| --- | --- | --- |
| Google Firebase (Authentication and Realtime Database) | Sign-in and storing your tracking data, reports and the shared list of tracked posts | Account information, tracking data, reports |
| Fireguard (`ouss.es/fireguard`), a sign-in page run by the developer | Hosts the Google sign-in card shown when you log in | Sign-in handshake only; no tracking data |
| YouTube Data API, Jikan (MyAnimeList) | Fetching public channel details and anime information | Public identifiers only; no personal data |
| Image hosts of post and entry covers | Displaying cover images | Your IP address, as with any image request |

Firebase is operated by Google; its handling of data is described in [Google's Privacy Policy](https://policies.google.com/privacy) and the [Firebase privacy information](https://firebase.google.com/support/privacy).

Your tracking data can only be read and written by your own account. The list of tracked posts and entries is public, and contains no user data.

## Sharing

We do not sell, rent or share your personal data with third parties, other than the service providers listed above that are needed to run the extension. We do not use your data for advertising, creditworthiness or any purpose unrelated to the extension's features.

## Retention and deletion

Your data is kept while your account exists. To delete it:

- **Delete your data and account:** open an issue at [github.com/EOussama/kol-pt/issues](https://github.com/EOussama/kol-pt/issues) or email the address below, and we will delete your account and everything stored under your user ID.
- **Remove local data:** uninstall the extension, or sign out, which clears the locally stored account and tracking data.

## Children

The extension is not directed at children under 13, and we do not knowingly collect their data.

## Changes

If this policy changes, the date above is updated and the new version is published in this repository. Material changes will be mentioned in the release notes.

## Contact

Questions or requests about your data: [oussama.essamadi@gmail.com](mailto:oussama.essamadi@gmail.com), or [open an issue](https://github.com/EOussama/kol-pt/issues/new/choose).
