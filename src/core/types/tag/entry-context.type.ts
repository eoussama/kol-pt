import type { IAnimeContext } from "./anime-context.type";
import type { IYouTubeContext } from "./youtube-context.type";



/**
 * @description
 * Generic entry context which resembles
 * extra data passed from the tag to the entry model.
 */
export type IEntryContext = IAnimeContext | IYouTubeContext;
