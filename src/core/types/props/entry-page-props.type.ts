/**
 * @description
 * Props for the entry detail view.
 */
export interface IEntryViewProps {

  /**
   * @description
   * The ID of the entry to show.
   */
  entryId: string;

  /**
   * @description
   * Whether the view is shown in a dialog on Patreon rather than in the popup.
   */
  isDialog?: boolean;

  /**
   * @description
   * Navigates back to the entries list. The back arrow is hidden without it.
   */
  onBack?: () => void;
}
