import { IPost } from "../types/post.type";
import { Tag } from "./tag.model";



export class Post {

  id: string;

  title: string;

  description: string;

  creationDate: Date;

  thumbnail: string;

  tags: Array<Tag>;

  constructor(model: IPost) {
    this.id = model.id ?? '';
    this.title = model.title ?? '';
    this.thumbnail = model.thumbnail ?? '';
    this.description = model.description ?? '';
    this.creationDate = new Date(model.creationDate);
    this.tags = model.tags.map(tag => new Tag(tag)) ?? [];
  }
}