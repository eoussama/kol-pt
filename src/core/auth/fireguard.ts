import type { TFiremittOptions } from "@eoussama/firemitt";

import { appConfig } from "../../config/app";
import { getFirebaseConfig } from "../../config/env";



/**
 * @description
 * The size of the Fireguard sign-in card.
 */
export const FIREGUARD_SIZE = { width: 450, height: 260 } as const;

/**
 * @description
 * Options for Firemitt's Google sign-in through Fireguard, branded for the
 * extension.
 *
 * @returns The Firemitt options, without the display mode
 */
export function getFiremittOptions(): TFiremittOptions {
  const { apiKey, appId, authDomain, measurementId, messagingSenderId, projectId, storageBucket } = getFirebaseConfig();

  return {
    url: appConfig.fireguardUrl,
    dim: { ...FIREGUARD_SIZE },
    config: {
      name: "KOL PT",
      logo: "https://github.com/eoussama/kol-pt/blob/main/public/icons/icon128x128.png?raw=true",
      theme: {
        text: "#222833",
        primary: "#1976d2",
        secondary: "#222833",
      },
      firebase: { apiKey, appId, authDomain, measurementId, messagingSenderId, projectId, storageBucket },
    },
  };
}
