/**
 * @description
 * Represents two possible view modes.
 */
export const EViewMode = {
  COMPACT: 0,
  EXPANDED: 1,
} as const;

export type TViewMode = (typeof EViewMode)[keyof typeof EViewMode];
