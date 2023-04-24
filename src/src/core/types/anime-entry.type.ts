import { IEntry } from "./entry.type";



export interface IAnimeEntry extends IEntry {

  malId: number;

  anilistId: number;

  kitsuId: string;
}