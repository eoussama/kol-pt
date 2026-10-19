// Builds the landing page into site-dist/: fills in the version and the store
// buttons, copies the images, and writes a redirect page for each store
// (e.g. /chrome/ sends visitors to the Chrome Web Store listing).
// Usage: node site/build.mjs   (SITE_URL and RELEASE_TAG are optional)
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";



const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const out = join(root, "site-dist");

/**
 * @description
 * The stores, in the order their buttons show.
 */
const STORES = [
  { key: "chrome", name: "Chrome", store: "Chrome Web Store" },
  { key: "edge", name: "Edge", store: "Microsoft Edge Add-ons" },
  { key: "firefox", name: "Firefox", store: "Firefox Add-ons" },
  { key: "safari", name: "Safari", store: "Mac App Store" },
];

/**
 * @description
 * Files copied next to the page, by their published name.
 */
const ASSETS = {
  "logo.png": "branding/logo.png",
  "icon32.png": "public/icons/icon32x32.png",
  "reactions.jpg": "branding/reactions.jpg",
  "feed.jpg": "branding/feed.jpg",
  "entries.jpg": "branding/entries.jpg",
  "entry.jpg": "branding/entry.jpg",
  "trailer.mp4": "branding/kol-pt-trailer.mp4",
};

/**
 * @description
 * Escapes text for HTML.
 *
 * @param {string} text - The text
 * @returns {string} The escaped text
 */
function escape(text) {
  return text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
}

/**
 * @description
 * Reads the store links, keeping only https ones. Each is normalized as a
 * URL, which percent-encodes characters such as `<` and `"`, so it is safe
 * to put in the redirect pages' markup and script.
 *
 * @returns {Record<string, string>} The links, by store key
 */
function readStoreLinks() {
  const links = JSON.parse(readFileSync(join(site, "stores.json"), "utf8"));

  return Object.fromEntries(STORES.map(({ key }) => {
    const link = typeof links[key] === "string" ? links[key].trim() : "";

    if (!link) {
      return [key, ""];
    }

    const url = URL.parse(link);

    if (url?.protocol !== "https:") {
      throw new Error(`site/stores.json: the ${key} link must be an https:// URL`);
    }

    return [key, url.href];
  }));
}

/**
 * @description
 * Renders the store buttons: a link for each store with a listing, and a
 * "coming soon" label for the others.
 *
 * @param {Record<string, string>} links - The store links
 * @returns {string} The buttons' HTML
 */
function renderStores(links) {
  return STORES
    .map(({ key, name, store }) => links[key]
      ? `<a class="store" href="${key}/"><strong>${name}</strong><span>${store}</span></a>`
      : `<div class="store soon" aria-disabled="true"><strong>${name}</strong><span>Coming soon</span></div>`)
    .join("\n        ");
}

/**
 * @description
 * Renders a store's redirect page.
 *
 * @param {{ name: string, store: string }} store - The store
 * @param {string} link - Its listing
 * @returns {string} The page's HTML
 */
function renderRedirect(store, link) {
  const href = escape(link);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KOL Patreon Tracker for ${store.name}</title>
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url=${href}">
  <link rel="canonical" href="${href}">
  <link rel="icon" type="image/png" href="../assets/icon32.png">
  <link rel="stylesheet" href="../styles.css">
  <script>location.replace(${JSON.stringify(link)});</script>
</head>
<body>
  <main class="redirect">
    <img src="../assets/logo.png" alt="" width="72" height="72">
    <p>Taking you to the ${store.store}…</p>
    <p><a href="${href}">Continue to the ${store.store}</a></p>
  </main>
</body>
</html>
`;
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = (process.env.RELEASE_TAG || pkg.version).replace(/^v/, "");
const siteUrl = (process.env.SITE_URL || "https://eoussama.github.io/kol-pt").replace(/\/?$/, "/");
const links = readStoreLinks();

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "assets"), { recursive: true });

const page = readFileSync(join(site, "index.html"), "utf8")
  .replaceAll("{{siteUrl}}", escape(siteUrl))
  .replaceAll("{{version}}", escape(version))
  .replace("{{stores}}", renderStores(links));

writeFileSync(join(out, "index.html"), page);
copyFileSync(join(site, "styles.css"), join(out, "styles.css"));

for (const [name, source] of Object.entries(ASSETS)) {
  copyFileSync(join(root, source), join(out, "assets", name));
}

for (const store of STORES) {
  if (links[store.key]) {
    mkdirSync(join(out, store.key));
    writeFileSync(join(out, store.key, "index.html"), renderRedirect(store, links[store.key]));
  }
}

process.stdout.write(`Built the landing page (version ${version}) in site-dist/\n`);
