import { PostsHelper } from './posts.helper';
import { Entry } from '../../../models/entry.model';
import { Anime } from '../../../models/anime.model';
import { FirebaseHelper } from '../firebase.helper';
import { Nullable } from '../../../types/nullable.type';
import { YouTube } from '../../../models/youtube.model';
import { IEntry } from '../../../types/entry/entry.type';
import { IReaction } from '../../../types/reaction.type';
import { EntryType } from '../../../enums/entry-type.enum';



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
  private static readonly DB_KEY = 'entries';

  /**
   * @description
   * Returns the list of all entries
   * @param cache Whether to use cache when needed
   */
  static async load(cache: boolean = true): Promise<Array<Entry>> {
    const data = await FirebaseHelper.get(this.DB_KEY, cache);
    return data?.map((entry: IEntry) => this.initEntry(entry));
  }

  /**
   * @description
   * Returns a specific entry
   *
   * @param id The ID of the entry
   * @param cache Whether to use cache when needed
   */
  static async get(id: string, cache: boolean = true): Promise<Nullable<Entry>> {
    const data = await this.load(cache);
    return data.find(entry => entry.id === id);
  }


  /**
   * @description
   * Retrieves reactions of a certain entry
   *
   * @param id The ID of the entry to get the reactions of
   * @param cache Whether to use cache when needed
   */
  static getReactions(id: string, cache: boolean = true): Promise<Array<IReaction>> {
    return new Promise(async resolve => {
      const posts = await PostsHelper.load(cache);
      const associatedPosts = posts.filter(post => post.tags.some(tag => tag.entry.id === id));

      const result: Array<IReaction> = associatedPosts
        .flatMap(post => post.tags
          .filter(tag => tag.entry.id === id)
          .map(tag => ({
            tag: tag,
            postId: post.id,
            date: post.creationDate
          })));

      resolve(result);
    });
  }

  /**
   * @description
   * Instantiates the correct class of an entry
   *
   * @param entry The entry's model
   */
  static initEntry(entry: IEntry): Entry {
    switch (entry.type) {
      case EntryType.Anime: return new Anime(entry as any);
      case EntryType.YouTube: return new YouTube(entry as any);
      default: return new Entry(entry);
    }
  }
}