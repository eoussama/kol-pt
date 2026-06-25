import type { NextOrObserver, User, UserCredential } from "firebase/auth";
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut } from "firebase/auth";
import { config } from "../../../config/env";
import { MessageType } from "../../enums/message-type.enum";
import { NavigationHelper } from "../navigator/navigation.helper";
import { FirebaseHelper } from "./firebase.helper";



/**
 * @description
 * Manages Firebase authentication
 */
export class AuthHelper {
  /**
   * @description
   * Logs user in using Google authentication
   *
   * @returns Promise resolving to the user credential
   */
  static login(): Promise<UserCredential> {
    return new Promise((resolve) => {
      const subscription = (e: MessageEvent) => {
        const origin = new URL(e.origin).host;

        if (e.isTrusted && config.authUrl.includes(origin)) {
          if (e.data.type === MessageType.Login) {
            const token = e.data.payload.token ?? "";
            const credential = GoogleAuthProvider.credential(token);

            if (token.length > 0) {
              resolve(signInWithCredential(FirebaseHelper.auth, credential));
            }

            window.removeEventListener("message", subscription);
          }
        }
      };

      window?.addEventListener("message", subscription);
      NavigationHelper.openAuth();
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
