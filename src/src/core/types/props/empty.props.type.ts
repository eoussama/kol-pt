/**
 * @description
 * Props of the Empty component.
 */
export interface IEmptyProps {

  /**
   * @description
   * The message to show
   */
  message: string | JSX.Element;

  /**
   * @description
   * Child elements
   */
  children: Array<JSX.Element>;
}