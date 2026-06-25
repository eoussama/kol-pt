/**
 * @description
 * Defines application routes.
 */
export const EPage = {
  /**
   * @description
   * The index page of the app.
   */
  INDEX: "/",

  /**
   * @description
   * The main feed page.
   */
  FEED: "feed",

  /**
   * @description
   * The entries page list.
   */
  ENTRIES: "entries",

  /**
   * @description
   * The entry detail page.
   */
  ENTRY: "entry",
} as const;

export type TPage = (typeof EPage)[keyof typeof EPage];
