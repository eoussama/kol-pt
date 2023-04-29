import { IEntry } from "../types/entry.type";
import { EntryType } from "../enums/entry-type.enum";



export class Entry {

  id: string;

  imdbId?: string;

  title: string;

  shortTitle: string;

  altTitles: Array<string>;

  type: EntryType;

  constructor(model?: IEntry) {
    this.id = model?.id ?? '';
    this.title = model?.title ?? '';
    this.imdbId = model?.imdbId ?? '';
    this.type = model?.type ?? EntryType.Anime;
    this.shortTitle = model?.shortTitle ?? this.title ?? '';
    this.altTitles = model?.altTitles ?? [this.shortTitle ?? ''];
  }

  openIMDb(): void {
    window.open(`https://www.imdb.com/title/${this.imdbId}`, '_blank');
  }
}