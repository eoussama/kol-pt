import { EntryType } from "../enums/entry-type.enum";



export interface IEntry {

  id: string;

  imdbId?: string;

  shortTitle?: string;

  altTitles?: Array<string>;

  title: string;

  type: EntryType;
}