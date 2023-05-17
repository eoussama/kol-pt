/**
 * @description
 * Props passed down to text expand component.
 */
export interface ITextExpandProps {
  
  /**
   * @description
   * The content to expand.
   */
  content: string;

  /**
   * @description
   * The minimum length visible by default.
   */
  minLength?: number;
}