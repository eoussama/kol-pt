import { IReaction } from '../reaction.type';
import { Entry } from '../../models/entry.model';



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