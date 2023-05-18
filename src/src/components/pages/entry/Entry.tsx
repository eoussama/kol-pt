import styles from './Entry.module.scss';

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useEntry } from '../../../hooks/entry.hook';
import Error from '../../layout/generic/error/Error';
import { Entry } from '../../../core/models/entry.model';
import EntryAka from '../../layout/entry/entry-aka/EntryAka';
import EntryHead from '../../layout/entry/entry-head/EntryHead';
import EntryLinks from '../../layout/entry/entry-links/EntryLinks';
import EntryReactions from '../../layout/entry/entry-reactions/EntryReactions';
import { IEntryPageProps } from '../../../core/types/props/entry-page-props.type';



/**
 * @description
 * The entry detail page
 */
function EntryPage(props?: IEntryPageProps): JSX.Element {
  const params = useParams();
  const entryId = useMemo(() => params.entryId ?? props?.entryId, [params, props?.entryId]);
  const { loading, entry, description, photo, viewCount, altTitles, genres, reactions } = useEntry(entryId ?? '');

  const dialogClass = Boolean(props?.entryId) ? styles['root--dialog'] : '';
  const classes = `${styles['root']} ${dialogClass}`;

  return (
    <Error error={!entry} message='Could not retrieve entry'>
      <div
        className={classes}
        style={{ backgroundImage: `url(${photo}), url(./images/graphs/placeholder.jpg)` }}
      >
        <EntryHead
          photo={photo}
          genres={genres}
          loading={loading}
          viewCount={viewCount}
          entry={entry as Entry}
          description={description}
          isDialog={Boolean(props?.entryId)}
        />

        <EntryAka
          altTitles={altTitles}
        />

        <EntryLinks
          entry={entry as Entry}
        />

        <EntryReactions
          reactions={reactions}
          entry={entry as Entry}
        />
      </div>
    </Error >
  );
}

export default EntryPage;