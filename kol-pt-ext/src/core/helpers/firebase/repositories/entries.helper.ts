import type { IAnimeEntry } from "../../../types/entry/anime-entry.type";
import type { IEntry } from "../../../types/entry/entry.type";
import type { IYouTubeEntry } from "../../../types/entry/youtube-entry.type";
import type { Nullable } from "../../../types/nullable.type";
import type { IReaction } from "../../../types/reaction.type";
import { EntryType } from "../../../enums/entry-type.enum";
import { Anime } from "../../../models/anime.model";
import { Entry } from "../../../models/entry.model";
import { YouTube } from "../../../models/youtube.model";
import { PostsHelper } from "./posts.helper";
import { RepositoryHelper } from "./repository.helper";



/**
 * @description
 * Helps with managing entries
 */
export class EntriesHelper {
  /**
   * @description
   * The name of the key that stors the entries
   * on the realtime database
   */
  private static readonly DB_KEY = "entries";

  /**
   * @description
   * Returns the list of all entries
   *
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to an array of Entry instances
   */
  static async load(cache: boolean = true): Promise<Array<Entry>> {
    const data = await RepositoryHelper.get<Array<IEntry>>(this.DB_KEY, cache);

    return data?.map((entry: IEntry) => this.initEntry(entry));
  }

  /**
   * @description
   * Returns a specific entry
   *
   * @param id - The ID of the entry
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to the matching Entry or undefined
   */
  static async get(id: string, cache: boolean = true): Promise<Nullable<Entry>> {
    const data = await this.load(cache);

    return data.find(entry => entry.id === id);
  }

  /**
   * @description
   * Retrieves reactions of a certain entry
   *
   * @param id - The ID of the entry to get the reactions of
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to an array of reactions for the entry
   */
  static async getReactions(id: string, cache: boolean = true): Promise<Array<IReaction>> {
    const posts = await PostsHelper.load(cache);
    const associatedPosts = posts.filter(post => post.tags.some(tag => tag.entry.id === id));

    return associatedPosts
      .flatMap(post => post.tags
        .filter(tag => tag.entry.id === id)
        .map(tag => ({
          tag,
          postId: post.id,
          date: post.creationDate,
        })));
  }

  /**
   * @description
   * Instantiates the correct class of an entry
   *
   * @param entry - The entry's model
   * @returns The instantiated Entry subclass
   */
  static initEntry(entry: IEntry): Entry {
    switch (entry.type) {
      case EntryType.Anime: return new Anime(entry as IAnimeEntry);

      case EntryType.YouTube: return new YouTube(entry as IYouTubeEntry);

      default: return new Entry(entry);
    }
  }
}
