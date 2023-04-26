import { EntryType } from "../enums/entry-type.enum";



export interface IEntry {

  id: string;

  imdbId?: string;

  shortTitle?: string;

  title: string;

  type: EntryType;
}