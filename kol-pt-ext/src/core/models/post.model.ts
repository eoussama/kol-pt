import type { IPost } from "../types/post.type";
import type { ISearch } from "../types/search.type";
import { Tag } from "./tag.model";



/**
 * @description
 * A class representing a post containing information about a post
 */
export class Post implements ISearch {
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
   * @description
   * Creates a new Post instance.
   *
   * @param model - The data model to use for the post
   */
  constructor(model: IPost) {
    this.id = model.id ?? "";
    this.title = model.title ?? "";
    this.thumbnail = model.thumbnail ?? "";
    this.description = model.description ?? "";
    this.creationDate = new Date(model.creationDate);
    this.tags = model.tags.map(tag => new Tag(tag)) ?? [];
  }

  /**
   * @description
   * Checks if model matches search query
   *
   * @param search - The search query
   * @returns True if the post matches the search query
   */
  match(search: string): boolean {
    const query = search.toLowerCase();
    const searchTarget = this.title
      .concat(this.description)
      .concat(this.getTagsQuery())
      .concat(this.creationDate.toLocaleString())
      .toLowerCase();

    return searchTarget.includes(query) || this.tags.some(tag => tag.entry.match(query));
  }

  /**
   * @description
   * Returns a string of tag info
   *
   * @returns Concatenated tag labels and descriptions
   */
  private getTagsQuery(): string {
    return this.tags
      .map(tag => tag.label
        .toString()
        .concat(tag.description),
      )
      .join("");
  }
}
