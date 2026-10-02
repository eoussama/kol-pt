/**
 * @description
 * Represents different types of entries.
 */
export const EEntryType = {
  ANIME: 0,
  MOVIE: 1,
  CARTOON: 2,
  YOUTUBE: 3,
  TV_SHOW: 4,
} as const;

export type TEntryType = (typeof EEntryType)[keyof typeof EEntryType];

/**
 * @description
 * Whether reactions to this type of entry are numbered by episode.
 *
 * @param type - The entry type
 * @returns True for anime, TV shows and cartoons
 */
export function hasEpisodes(type: TEntryType | undefined): boolean {
  return type === EEntryType.ANIME || type === EEntryType.TV_SHOW || type === EEntryType.CARTOON;
}
