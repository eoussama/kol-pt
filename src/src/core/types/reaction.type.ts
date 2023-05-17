import { Tag } from '../models/tag.model';



/**
 * @description
 * Describes a reaction to an entry.
 */
export interface IReaction {

  /**
   * @description
   * The ID of the post that has the reaction.
   */
  postId: string;

  /**
   * @description
   * The time of the reaction, usually the associated post's creation date.
   */
  date: Date;

  /**
   * @description
   * The tag info (reaction)
   */
  tag: Tag;
}