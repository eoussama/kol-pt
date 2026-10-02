/**
 * @description
 * Settings every part of the extension may use, including the content
 * script. Each variable is read by its full name so the bundler inlines only
 * these, never the whole environment.
 *
 * @property patreonUrl - Patreon's base URL.
 * @property creatorName - The creator's Patreon handle.
 * @property fireguardUrl - The Fireguard sign-in page.
 */
export const appConfig = {
  patreonUrl: import.meta.env.WXT_PATREON_URL || "https://www.patreon.com",
  creatorName: import.meta.env.WXT_CREATOR_NAME || "KingOfLightning",
  fireguardUrl: import.meta.env.WXT_FIREGUARD_URL || "https://ouss.es/fireguard",
} as const;
