import { FirebaseHelper } from "./firebase.helper";
import { Nullable } from "../types/nullable.type";
import { Entry } from "../models/entry.model";
import { get, ref } from "firebase/database";
import { IEntry } from "../types/entry.type";



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
    const data = await get(ref(FirebaseHelper.getDb(), this.DB_KEY));
    return data.val()?.map((entry: IEntry) => new Entry(entry));
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