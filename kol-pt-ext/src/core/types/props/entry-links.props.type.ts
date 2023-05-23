import { Entry } from '../../models/entry.model';



/**
 * @description
 * Props of the entry links component.
 */
export interface IEntryPageLinksSectionProps {

  /**
   * @description
   * If the dialog page is loaded as a dialog.
   */
  isDialog: boolean;

  /**
   * @description
   * The target entry
   */
  entry: Entry;
}