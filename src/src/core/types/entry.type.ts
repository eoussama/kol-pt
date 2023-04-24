import { EntryType } from "../enums/entry-type.enum";



export interface IEntry {

  uuid: string;

  imdbId?: string;

  title: string;

  type: EntryType;
}