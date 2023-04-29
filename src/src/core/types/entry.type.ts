import { EntryType } from "../enums/entry-type.enum";



export interface IEntry {

  id: string;

  imdbId?: string;

  shortTitle?: string;

  altTitle?: string;

  title: string;

  type: EntryType;
}