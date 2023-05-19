import { FirebaseHelper } from './firebase.helper';
import { UserCredential, signInWithPopup, signOut } from 'firebase/auth';



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
}