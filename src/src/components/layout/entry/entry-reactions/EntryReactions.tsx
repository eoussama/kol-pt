import styles from './EntryReactions.module.scss';

import { IEntryPageReactionsSectionProps } from '../../../../core/types/props/entry-reactions.props.type';



/**
 * @description
 * Renders the entry related reactions.
 */
function EntryReactions(props: IEntryPageReactionsSectionProps): JSX.Element {
  return (
    <div className={styles['entry-reactions']}>
       <div className={styles['title']}>Reactions</div>
    </div>
  );
}

export default EntryReactions;