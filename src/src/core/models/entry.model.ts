import { IEntry } from "../types/entry.type";
import { EntryType } from "../enums/entry-type.enum";



export class Entry {

  id: string;

  imdbId?: string;

  title: string;

  shortTitle: string;

  type: EntryType;

  constructor(model?: IEntry) {
    this.id = model?.id ?? '';
    this.imdbId = model?.id ?? '';
    this.title = model?.title ?? '';
    this.type = model?.type ?? EntryType.Anime;
    this.shortTitle = model?.shortTitle ?? this.title;
  }
}