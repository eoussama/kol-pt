import { IPost } from "../types/post.type";
import { Tag } from "./tag.model";



/**
 * @description
 * A class representing a post containing information about a post
 */
export class Post {

  /**
   * @description
   * The unique identifier for the post.
   */
  id: string;

  /**
   * @description
   * The title of the post.
   */
  title: string;

  /**
   * @description
   * A brief description of the post.
   */
  description: string;

  /**
   * @description
   * The date and time the post was created.
   */
  creationDate: Date;

  /**
   * @description
   * The URL of the post's thumbnail image.
   */
  thumbnail: string;

  /**
   * @description
   * An array of tags associated with the post.
   */
  tags: Array<Tag>;

  /**
   * @constructor
   * @param model The data model to use for the post.
   */
  constructor(model: IPost) {
    this.id = model.id ?? '';
    this.title = model.title ?? '';
    this.thumbnail = model.thumbnail ?? '';
    this.description = model.description ?? '';
    this.creationDate = new Date(model.creationDate);
    this.tags = model.tags.map(tag => new Tag(tag)) ?? [];
  }
}