/**
 * @description
 * The properties passed down to the loader element
 */
export interface ILoaderProps {
  
  /**
   * @description
   * The width of the loader, should also include the unite.
   */
  width?: string;

  /**
   * @description
   * The height of the loader, should also include the unite.
   */
  height?: string;

  /**
   * @description
   * If the loader is flat (without rounded corners).
   */
  flat?: boolean;

  /**
   * @description
   * If the loader is overlayed on top of its parent container.
   */
  overlay?: boolean;
}