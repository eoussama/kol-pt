import { Entry } from "./entry.model";
import { ITag } from "../types/tag.type";
import { TimeHelper } from "../helpers/parse/time.helper";
import { EntriesHelper } from "../helpers/firebase/entries.helper";



export class Tag {

  id: string;

  entry!: Entry;

  label: string;

  description: string;

  startTime: number;

  endTime: number;

  constructor(model: ITag | Tag) {
    this.id = model.id ?? '';
    this.label = model.label ?? '';
    this.description = model.description ?? '';

    this.endTime = model.endTime ?? 0;
    this.startTime = model.startTime ?? 0;

    if ('entry' in model) {
      this.entry = EntriesHelper.initEntry(model.entry);
    }
  }

  getMinTitle(): string {
    return `${this.entry?.shortTitle} - ${this.label}`;
  }

  getDetailDescription(): string {
    return `Episode ${this.label}`;
  }

  getDetailExtra(): string {
    return `Starts at ${TimeHelper.parse(this.startTime)}, Reaction time: ${TimeHelper.format(this.endTime - this.startTime)}`;
  }
}