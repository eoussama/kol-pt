import type { User } from "firebase/auth/web-extension";
import type { IAuthUser } from "../core/types/auth-user.type";

import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut } from "firebase/auth/web-extension";
import { authUserItem } from "../core/storage/items";
import { getFirebaseAuth } from "./firebase";



/**
 * @description
 * How long to wait for Firebase to restore a session, in milliseconds.
 */
const AUTH_READY_TIMEOUT_MS = 5000;

/**
 * @description
 * Keeps only what the popup and content scripts need to know about a user.
 *
 * @param user - The Firebase user
 * @returns The shared user
 */
export function toAuthUser(user: User): IAuthUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL };
}

/**
 * @description
 * Publishes the signed-in user to extension storage whenever it changes, so
 * every page sees the same state, even after the background was suspended.
 * Must run when the background starts.
 *
 * @param onChange - Also called with the user on every change
 * @returns A function that stops watching
 */
export function watchAuthState(onChange?: (user: IAuthUser | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), (user) => {
    const authUser = user ? toAuthUser(user) : null;

    authUserItem.setValue(authUser).catch(() => undefined);
    onChange?.(authUser);
  });
}

/**
 * @description
 * Signs in with a Google ID token obtained by the login window.
 *
 * @param idToken - The Google ID token
 * @returns Promise resolving to the signed-in user
 */
export async function signInWithGoogleToken(idToken: string): Promise<IAuthUser> {
  const { user } = await signInWithCredential(getFirebaseAuth(), GoogleAuthProvider.credential(idToken));

  return toAuthUser(user);
}

/**
 * @description
 * Signs out.
 *
 * @returns Promise that resolves once signed out
 */
export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

/**
 * @description
 * Returns the signed-in user, once Firebase has restored any saved session.
 *
 * @returns Promise resolving to the user
 * @throws When nobody is signed in
 */
export async function requireUser(): Promise<User> {
  const auth = getFirebaseAuth();

  await Promise.race([
    auth.authStateReady(),
    new Promise(resolve => setTimeout(resolve, AUTH_READY_TIMEOUT_MS)),
  ]);

  if (!auth.currentUser) {
    throw new Error("Not signed in");
  }

  return auth.currentUser;
}
