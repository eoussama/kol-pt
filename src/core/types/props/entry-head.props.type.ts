import type { Entry } from "../../models/entry.model";



/**
 * @description
 * Props of the entry head component.
 */
export interface IEntryPageHeadSectionProps {

  /**
   * @description
   * The target entry.
   */
  entry: Entry;

  /**
   * @description
   * The loading state of the entry detail.
   */
  loading: boolean;

  /**
   * @description
   * The channel's subscriber count (YouTube entries only).
   */
  subscribers: number;

  /**
   * @description
   * The entry's description.
   */
  description: string;

  /**
   * @description
   * The list of entry genres (Not applicable to all types).
   */
  genres: Array<string>;

  /**
   * @description
   * Navigates back to the entries list. The back arrow is hidden without it.
   */
  onBack?: () => void;
}
