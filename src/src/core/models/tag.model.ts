import { Entry } from "./entry.model";
import { ITag } from "../types/tag.type";
import { EntryType } from "../enums/entry-type.enum";
import { TimeHelper } from "../helpers/parse/time.helper";
import { EntriesHelper } from "../helpers/firebase/entries.helper";



/**
 * @description
 * A class representing a tag applied to an entry in a reaction video
 */
export class Tag {

  /**
   * @description
   * The unique identifier for the tag
   */
  id: string;

  /**
   * @description
   * The entry associated with the tag
   */
  entry!: Entry;

  /**
   * @description
   * The label of the tag
   */
  label: string;

  /**
   * @description
   * The description of the tag
   */
  description: string;

  /**
   * @description
   * The start time of the tag (in milliseconds)
   */
  startTime: number;

  /**
   * @description
   * The end time of the tag (in milliseconds)
   */
  endTime: number;

  /**
   * @constructor
   * @param model The tag data to initialize the instance with
   */
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

  /**
   * @description
   * Gets a shortened version of the title for the tag's entry
   *
   * @returns A string representing the entry's title and the tag's label
   */
  getMinTitle(): string {
    return `${this.entry?.shortTitle} - ${this.label}`;
  }

  /**
   * @description
   * Gets a detailed description of the tag
   *
   * @returns A string describing the tag and the episode it corresponds to
   */
  getDetailDescription(): string {
    return `Episode ${this.label}`;
  }

  /**
   * @description
   * Gets extra details about the tag
   *
   * @returns A string representing the start time of the tag and the duration of the reaction
   */
  getDetailExtra(): string {
    return `Starts at ${TimeHelper.parse(this.startTime)}, Reaction time: ${TimeHelper.format(this.endTime - this.startTime)}`;
  }

  /**
   * @description
   * Checks if instance is of a given type
   *
   * @param type The type to check against
   */
  is(type: EntryType): boolean {
    return this.entry.type === type;
  }
}