import { IEntry } from "../types/entry.type";
import { Entry } from "../models/entry.model";
import { Nullable } from "../types/nullable.type";
import { FirebaseHelper } from "./firebase.helper";



export class EntriesHelper {

  /**
   * @description
   * The name of the key that stors the entries
   * on the realtime database
   */
  private static readonly DB_KEY = 'entries';

  /**
   * @description
   * Returns the list of all entries
   */
  static async load(): Promise<Array<Entry>> {
    const data = await FirebaseHelper.get(this.DB_KEY);
    return data?.map((entry: IEntry) => new Entry(entry));
  }

  /**
   * @description
   * Returns a specific entry
   *
   * @param id The ID of the entry
   */
  static async get(id: string): Promise<Nullable<Entry>> {
    const data = await this.load();
    return data.find(entry => entry.id === id);
  }
}