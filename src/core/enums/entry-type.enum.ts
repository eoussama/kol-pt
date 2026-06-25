/**
 * @description
 * Represents different types of entries.
 */
export const EEntryType = {
  ANIME: 0,
  MOVIE: 1,
  CARTOON: 2,
  YOUTUBE: 3,
} as const;

export type TEntryType = (typeof EEntryType)[keyof typeof EEntryType];
