import { IEntryContext } from "./entry-context.type";

/**
 * @description
 * Interface representing a tag.
 */
export interface ITag {
  
  /**
   * @description
   * The ID of the tag.
   */
  id: string;

  /**
   * @description
   * The tag's entry context, extra data passed down to the entry.
   */
  context: IEntryContext;

  /**
   * @description
   * The ID of the entry associated with the tag.
   */
  entryId: string;

  /**
   * @description
   * The label of the tag.
   */
  label: string;

  /**
   * @description
   * The description of the tag.
   */
  description: string;

  /**
   * @description
   * The start time of the tag (in seconds).
   */
  startTime: number;

  /**
   * @description
   * The end time of the tag (in seconds).
   */
  endTime: number;
}
