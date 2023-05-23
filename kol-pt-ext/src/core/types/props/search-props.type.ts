/**
 * @description
 * Props of the Search component.
 */
export interface ISearchProps {

  /**
   * @description
   * The placeholder message to show in the input
   * when it's empty.
   */
  placeholder?: string;

  /**
   * @description
   * Optional elements to show next to the search input
   */
  actions?: JSX.Element;

  /**
   * @description
   * The search handler
   *
   * @param e The search event object
   * @returns 
   */
  onSearch: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}