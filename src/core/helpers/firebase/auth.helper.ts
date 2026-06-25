import type { NextOrObserver, User, UserCredential } from "firebase/auth";
import { FiremittHelper } from "@eoussama/firemitt";
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut } from "firebase/auth";
import { config } from "../../../config/env";
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
    return FiremittHelper.auth({
      url: config.fireguardUrl,
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
        firebase: {
          appId: config.appId,
          apiKey: config.apiKey,
          projectId: config.projectId,
          authDomain: config.authDomain,
          measurementId: config.measurementId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
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
