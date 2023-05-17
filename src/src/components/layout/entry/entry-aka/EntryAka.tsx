import styles from './EntryAka.module.scss';

import { IEntryPageAkaSectionProps } from '../../../../core/types/props/entry-aka.props.type';
import { Tooltip } from '@mui/material';


/**
 * @description
 * Renders the aka section of the entry detail.
 *
 * @param props The component's properties
 */
function EntryAka(props: IEntryPageAkaSectionProps): JSX.Element {
  const { altTitles } = props;

  return (
    <div className={styles['entry-aka']}>
      <div className={styles['title']}>Aliases</div>

      <ul className={styles['aliases']}>
        {altTitles.map((alt, i) => <li
          key={i}
          className={styles['alias']}
        >
          <Tooltip title={alt.official ? 'Official title that the Anime is refered to by.' : 'Unofficial title, used by KOL.'}>
            <span className={styles['alias__type']}>
              <>{alt.official ? 'official' : 'kol'}</>
            </span>
          </Tooltip>
          {alt.title}
        </li>)}
      </ul>
    </div>
  );
}

export default EntryAka;