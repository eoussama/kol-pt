import type { NextOrObserver, User, UserCredential } from "firebase/auth";

import { FiremittHelper } from "@eoussama/firemitt";
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut } from "firebase/auth";
import { getConfig } from "../../../config/env";
import { FirebaseHelper } from "./firebase.helper";



/**
 * @description
 * Manages Firebase authentication
 */
export class AuthHelper {
  /**
   * @description
   * Logs user in using Google authentication via Fireguard
   *
   * @returns Promise resolving to the user credential
   */
  static login(): Promise<UserCredential> {
    if (!getConfig().fireguardUrl) {
      return Promise.reject(new Error("WXT_FIREGUARD_URL is not configured."));
    }

    return FiremittHelper.auth({
      url: getConfig().fireguardUrl,
      pos: {
        y: 50,
        x: Math.round(window.screen.width / 2 - 225),
      },
      dim: {
        width: 450,
        height: 260,
      },
      config: {
        name: "KOL PT",
        logo: "https://github.com/eoussama/kol-pt/blob/main/public/icons/icon128x128.png?raw=true",
        theme: {
          text: "#222833",
          primary: "#1976d2",
          secondary: "#222833",
        },
        firebase: {
          appId: getConfig().appId,
          apiKey: getConfig().apiKey,
          projectId: getConfig().projectId,
          authDomain: getConfig().authDomain,
          measurementId: getConfig().measurementId,
          storageBucket: getConfig().storageBucket,
          messagingSenderId: getConfig().messagingSenderId,
        },
      },
    }).then((token) => {
      const credential = GoogleAuthProvider.credential(token);

      return signInWithCredential(FirebaseHelper.auth, credential);
    });
  }

  /**
   * @description
   * Logs user out
   *
   * @returns Promise that resolves when sign-out is complete
   */
  static logout(): Promise<void> {
    return signOut(FirebaseHelper.auth);
  }

  /**
   * @description
   * Authentication state change
   *
   * @param callback - Observer for auth state changes
   * @returns Unsubscribe function
   */
  static onChange(callback: NextOrObserver<User>) {
    return onAuthStateChanged(FirebaseHelper.auth, callback);
  }
}
