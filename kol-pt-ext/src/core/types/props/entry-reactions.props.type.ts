import type { Entry } from "../../models/entry.model";
import type { IReaction } from "../reaction.type";



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
