import type { Browser } from "wxt/browser";
import type { TEnvelope, TRequest, TRequestType, TResponse } from "../../core/messaging/protocol";

import { browser } from "wxt/browser";
import { isOwnMessage, RequestSchema } from "./requests.schema";



/**
 * @description
 * A handler for every request, by name.
 */
export type THandlers = {
  [K in TRequestType]: (request: TRequest<K>, sender: Browser.runtime.MessageSender) => Promise<TResponse<K>>;
};

/**
 * @description
 * Answers one request: validates it, runs its handler and wraps the outcome.
 *
 * @param handlers - The request handlers
 * @param message - The raw message
 * @param sender - Who sent it
 * @returns Promise resolving to the response envelope
 */
export async function handleRequest(handlers: THandlers, message: unknown, sender: Browser.runtime.MessageSender): Promise<TEnvelope<unknown>> {
  const parsed = RequestSchema.safeParse(message);

  if (!parsed.success) {
    return { ok: false, error: "Invalid request" };
  }

  const request = parsed.data as TRequest;
  const handler = handlers[request.type] as (request: TRequest, sender: Browser.runtime.MessageSender) => Promise<unknown>;

  try {
    return { ok: true, data: await handler(request, sender) };
  }
  catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * @description
 * Answers the extension's requests. Responses go through `sendResponse`
 * with the channel kept open, which behaves the same in Chromium, Firefox
 * and Safari. Messages without the extension's marker are left alone.
 *
 * @param handlers - The request handlers
 */
export function serve(handlers: THandlers): void {
  browser.runtime.onMessage.addListener((message: unknown, sender: Browser.runtime.MessageSender, sendResponse: (response: unknown) => void) => {
    if (!isOwnMessage(message)) {
      return undefined;
    }

    handleRequest(handlers, message, sender).then(sendResponse);

    return true;
  });
}

/**
 * @description
 * Whether a message comes from one of the extension's own pages (popup,
 * login window), as opposed to a content script running on a website.
 *
 * @param sender - Who sent the message
 * @returns True for extension pages
 */
export function isExtensionPage(sender: Browser.runtime.MessageSender): boolean {
  return sender.id === browser.runtime.id && (sender.url ?? "").startsWith(browser.runtime.getURL("/"));
}
