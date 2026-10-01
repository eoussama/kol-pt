import type { TEntry } from "../schemas/entry/entry.schema";
import type { TPost } from "../schemas/post.schema";

import { EEntryType } from "../enums/entry-type.enum";
import { Anime } from "./anime";
import { Entry } from "./entry";
import { Post } from "./post";
import { Tag } from "./tag";
import { YouTube } from "./youtube";



/**
 * @description
 * A reaction to an entry, with the post it is in.
 */
export interface IReaction {
  postId: string;
  date: Date;
  tag: Tag;
}

/**
 * @description
 * Creates the domain object for an entry, by type.
 *
 * @param model - The entry's data
 * @returns The entry
 */
export function createEntry(model: TEntry): Entry {
  switch (model.type) {
    case EEntryType.ANIME: return new Anime(model);

    case EEntryType.YOUTUBE: return new YouTube(model);

    default: return new Entry(model);
  }
}

/**
 * @description
 * Builds posts with their tags joined to entries, newest post first.
 * A tag whose entry is missing keeps a null entry.
 *
 * @param posts - The posts' data
 * @param entries - The entries' data
 * @returns The posts
 */
export function hydratePosts(posts: ReadonlyArray<TPost>, entries: ReadonlyArray<TEntry>): Array<Post> {
  const entriesById = new Map(entries.map(entry => [entry.id, createEntry(entry)]));

  return posts
    .map(post => new Post(post, post.tags.map(tag => new Tag(tag, entriesById.get(tag.entryId) ?? null))))
    .sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime());
}

/**
 * @description
 * Lists the reactions to an entry across posts, newest first.
 *
 * @param posts - The posts
 * @param entryId - The entry's ID
 * @returns The reactions
 */
export function findReactions(posts: ReadonlyArray<Post>, entryId: string): Array<IReaction> {
  return posts.flatMap(post => post.tags
    .filter(tag => tag.entryId === entryId)
    .map(tag => ({ tag, postId: post.id, date: post.creationDate })));
}
