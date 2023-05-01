import { ITag } from "./tag/tag.type";



/**
 * @description
 * Defines the structure of a post object containing various properties and an array of tags.
 */
export interface IPost {
  
  /**
   * @description
   * The unique identifier of the post.
   */
  id: string;

  /**
   * @description
   * The title of the post.
   */
  title: string;

  /**
   * @description
   * A short description of the post.
   */
  description: string;

  /**
   * @description
   * The creation date of the post in milliseconds since the Unix epoch.
   */
  creationDate: number;

  /**
   * @description
   * The URL of the post's thumbnail image.
   */
  thumbnail: string;

  /**
   * @description
   * An array of tags associated with the post.
   */
  tags: Array<ITag>;
}