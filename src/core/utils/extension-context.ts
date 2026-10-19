/**
 * @description
 * Whether an error comes from a content script outliving its extension:
 * once the extension is reloaded or updated, the scripts left in open tabs
 * can no longer reach it, and every call to it throws until the tab reloads.
 *
 * @param error - The error
 * @returns True if the extension's context is gone
 */
export function isContextInvalidated(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Extension context invalidated");
}
