import { Entry } from "./entry.model";
import { EntryType } from "../enums/entry-type.enum";
import { IAnimeEntry } from "../types/anime-entry.type";



export class Anime extends Entry {

  malId: number;

  anilistId: number;

  kitsuId: string;

  constructor(model?: IAnimeEntry) {
    super(model);

    this.type = EntryType.Anime;
    this.malId = model?.malId ?? -1;
    this.kitsuId = model?.kitsuId ?? '';
    this.anilistId = model?.anilistId ?? -1;
  }

  openMAL(): void {
    window.open(`https://myanimelist.net/anime/${this.malId}`, '_blank');
  }

  openAniList(): void {
    window.open(`https://anilist.co/anime/${this.anilistId}`, '_blank');
  }

  openKitsu(): void {
    window.open(`https://kitsu.io/anime/${this.kitsuId}`, '_blank');
  }
}