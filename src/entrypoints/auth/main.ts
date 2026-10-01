import { FiremittHelper } from "@eoussama/firemitt";
import { FIREGUARD_SIZE, getFiremittOptions } from "../../core/auth/fireguard";
import { request } from "../../core/messaging/client";

import "./style.css";



/**
 * @description
 * Firemitt's error when the viewer closes the sign-in card.
 */
const CLOSED_ERROR = "The authentication window was closed.";

const container = document.getElementById("fireguard") as HTMLDivElement;
const status = document.getElementById("status") as HTMLParagraphElement;
const actions = document.getElementById("actions") as HTMLDivElement;
const retryButton = document.getElementById("retry") as HTMLButtonElement;
const popupButton = document.getElementById("popup") as HTMLButtonElement;

/**
 * @description
 * Shows a message, with the fallback actions when something went wrong.
 *
 * @param message - The message
 * @param failed - Whether to offer the fallback actions
 */
function showStatus(message: string, failed = false): void {
  status.textContent = message;
  actions.hidden = !failed;
}

/**
 * @description
 * Hands the Google token to the background, which owns the Firebase session,
 * then closes the window.
 *
 * @param idToken - The Google ID token from Fireguard
 * @returns Promise that resolves once signed in
 */
async function completeSignIn(idToken: string): Promise<void> {
  showStatus("Signing in...");

  const user = await request("auth.signIn", { idToken });

  showStatus(`Signed in${user.email ? ` as ${user.email}` : ""}.`);
  setTimeout(() => window.close(), 800);
}

/**
 * @description
 * Reports a failed attempt. Closing the card closes the window.
 *
 * @param error - Why it failed
 */
function onFailure(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);

  if (message === CLOSED_ERROR) {
    window.close();

    return;
  }

  container.replaceChildren();
  showStatus(`Could not sign in: ${message}`, true);
}

/**
 * @description
 * Signs in with the Fireguard card embedded in this window. Unlike a popup
 * opened from the toolbar popup, this window keeps running when it loses
 * focus, which the Google sign-in window takes.
 */
function signInHere(): void {
  showStatus("");
  container.replaceChildren();

  FiremittHelper.auth({ ...getFiremittOptions(), mode: "iframe", iframe: { container } })
    .then(completeSignIn)
    .catch(onFailure);
}

/**
 * @description
 * Signs in with Fireguard in a popup window instead. Must run from a click,
 * or the browser blocks the popup.
 */
function signInWithPopup(): void {
  container.replaceChildren();
  showStatus("Continue in the popup window...");

  FiremittHelper.auth({
    ...getFiremittOptions(),
    mode: "popup",
    pos: {
      x: Math.round(window.screenX + (window.outerWidth - FIREGUARD_SIZE.width) / 2),
      y: Math.round(window.screenY + 50),
    },
  })
    .then(completeSignIn)
    .catch(onFailure);
}

retryButton.addEventListener("click", signInHere);
popupButton.addEventListener("click", signInWithPopup);

signInHere();
