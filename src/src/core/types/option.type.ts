/**
 * @description
 * Popover menu option
 */
export interface IOption {

  /**
   * @description
   * The option's label
   */
  label: string;

  /**
   * @description
   * The icon's path
   */
  icon: string;

  /**
   * @description
   * Alt text for the icon
   */
  iconAlt: string;

  /**
   * @description
   * The action to trigger on click
   *
   * @param onClose Closing handler for the menu
   */
  action: () => void;
}