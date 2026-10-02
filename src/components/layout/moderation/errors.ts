/**
 * @description
 * Turns a failed request into a sentence for the person.
 *
 * @param error - What the request failed with
 * @returns The message to show
 */
export function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/permission/i.test(message)) {
    return "The database refused this change. Check that you are still allowed to make it.";
  }

  return message || "Something went wrong. Try again.";
}
