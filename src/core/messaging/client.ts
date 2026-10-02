import type { TEnvelope, TPayload, TRequest, TRequestType, TResponse } from "./protocol";

import { browser } from "wxt/browser";
import { MESSAGE_CHANNEL } from "./protocol";



/**
 * @description
 * Sends a request to the background and returns its response.
 *
 * @param type - The request's name
 * @param payload - The request's data
 * @returns Promise resolving to the response, rejecting with the background's error
 */
export async function request<K extends TRequestType>(type: K, payload: TPayload<K>): Promise<TResponse<K>> {
  const message = { channel: MESSAGE_CHANNEL, type, ...payload } as TRequest<K>;
  const envelope = await browser.runtime.sendMessage(message) as TEnvelope<TResponse<K>> | undefined;

  if (!envelope) {
    throw new Error(`No response to "${type}"`);
  }

  if (!envelope.ok) {
    throw new Error(envelope.error);
  }

  return envelope.data;
}
