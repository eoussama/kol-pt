import { Entry } from '../../models/entry.model';



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
   * The photo url of the entry.
   */
  photo: string;
  
  /**
   * @description
   * The view count of the entry (Applciable to YouTube entries only).
   */
  viewCount: number;
  
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
}