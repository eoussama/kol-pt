import { FirebaseHelper } from './firebase.helper';
import { NextOrObserver, User, UserCredential, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';



/**
 * @description
 * Manages Firebase authentication
 */
export class AuthHelper {

  /**
   * @description
   * Logs user in using Google authentication
   */
  static login(): Promise<UserCredential> {
    return signInWithPopup(FirebaseHelper.auth, FirebaseHelper.provider);
  }

  /**
   * @description
   * Logs user out
   */
  static logout(): Promise<void> {
    return signOut(FirebaseHelper.auth);
  }

  /**
   * @description
   * Authentication state change
   */
  static onChange(callback: NextOrObserver<User>) {
    return onAuthStateChanged(FirebaseHelper.auth, callback);
  }
}