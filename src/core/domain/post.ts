import type { TPost } from "../schemas/post.schema";
import type { ISearch } from "./search";
import type { Tag } from "./tag";



/**
 * @description
 * A Patreon post and the reactions it contains
 */
export class Post implements ISearch {
  /**
   * @description
   * The Patreon post ID.
   */
  readonly id: string;

  /**
   * @description
   * The title of the post.
   */
  readonly title: string;

  /**
   * @description
   * A brief description of the post.
   */
  readonly description: string;

  /**
   * @description
   * The date and time the post was created.
   */
  readonly creationDate: Date;

  /**
   * @description
   * The URL of the post's thumbnail image.
   */
  readonly thumbnail: string;

  /**
   * @description
   * The reactions in the post, by start time.
   */
  readonly tags: ReadonlyArray<Tag>;

  /**
   * @description
   * Creates a new Post instance.
   *
   * @param model - The post's data
   * @param tags - The post's reactions
   */
  constructor(model: TPost, tags: ReadonlyArray<Tag>) {
    this.id = model.id;
    this.title = model.title;
    this.thumbnail = model.thumbnail;
    this.description = model.description;
    this.creationDate = new Date(model.creationDate);
    this.tags = [...tags].sort((a, b) => a.startTime - b.startTime);
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
    const searchTarget = [
      this.title,
      this.description,
      this.creationDate.toLocaleString(),
      ...this.tags.flatMap(tag => [tag.label, tag.description]),
    ]
      .join(" ")
      .toLowerCase();

    return searchTarget.includes(query) || this.tags.some(tag => tag.entry?.match(query));
  }
}
