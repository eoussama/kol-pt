import { Entry } from "./entry.model";
import { ITag } from "../types/tag.type";



export class Tag {

  id: string;

  entry!: Entry;

  label: string;

  description: string;

  startTime: number;

  endTime: string;

  constructor(model: ITag) {
    this.id = model.id ?? '';
    this.label = model.label ?? '';
    this.description = model.description ?? '';

    this.endTime = model.endTime ?? 0;
    this.startTime = model.startTime ?? 0;
  }

  getLabel(): string {
    return `${this.entry?.shortTitle} - ${this.label}`;
  }
}