import createCache from "@emotion/cache";



/**
 * @description
 * Emotion cache for the content script. The `kolpt` key namespaces every
 * class MUI generates on Patreon's page, so they cannot collide with the
 * page's own styles.
 */
export const emotionCache = createCache({ key: "kolpt" });
