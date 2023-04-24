import { ITag } from "./tag.type";



export interface IPost {

  id: number;

  title: string;

  description: string;

  date: number;

  thumbnail: string;

  tags: Array<ITag>;
}