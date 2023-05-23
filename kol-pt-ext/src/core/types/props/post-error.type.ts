/**
 * @description
 * Props for post props
 */
export interface IPostErrorProps {

  /**
   * @description
   * The message to display
   */
  message: string;

  /**
   * @description
   * If the error should be displayed
   */
  error: boolean;

  /**
   * @description
   * The child elements
   */
  children?: JSX.Element;
}