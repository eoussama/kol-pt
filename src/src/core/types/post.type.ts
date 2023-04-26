import { ITag } from "./tag.type";



export interface IPost {

  id: string;

  title: string;

  description: string;

  creationDate: number;

  thumbnail: string;

  tags: Array<ITag>;
}