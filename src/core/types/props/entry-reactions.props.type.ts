import type { Entry } from "../../domain/entry";
import type { IReaction } from "../../domain/hydrate";



/**
 * @description
 * Props of the entry reactions component.
 */
export interface IEntryPageReactionsSectionProps {

  /**
   * @description
   * The parent entry.
   */
  entry: Entry;

  /**
   * @description
   * The list of associated reactions.
   */
  reactions: Array<IReaction>;
}
