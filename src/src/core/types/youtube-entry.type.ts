import { IEntry } from "./entry.type";



export interface IYouTubeEntry extends IEntry {

  videoUrl: string;

  channelUrl: string;

  channelName: string;
}