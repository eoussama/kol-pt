import styles from './Entry.module.scss';

import { useMemo } from 'react';
import Error from '../../layout/error/Error';
import { useParams } from 'react-router-dom';
import { useEntry } from '../../../hooks/entry.hook';
import EntryAka from '../../layout/entry-aka/EntryAka';
import EntryHead from '../../layout/entry-head/EntryHead';
import EntryLinks from '../../layout/entry-links/EntryLinks';
import { Entry as EntryModel } from '../../../core/models/entry.model';



/**
 * @description
 * The entry detail page
 */
function Entry(): JSX.Element {
  const params = useParams();
  const entryId = useMemo(() => params.entryId, [params]);
  const { loading, entry, description, photo, viewCount, altTitles, genres } = useEntry(entryId ?? '');

  return (
    <Error error={!entry} message='Could not retrieve entry'>
      <div className={styles['root']}>
        <EntryHead
          photo={photo}
          genres={genres}
          loading={loading}
          viewCount={viewCount}
          description={description}
          entry={entry as EntryModel}
        />

        <EntryAka
          altTitles={altTitles}
        />

        <EntryLinks
          entry={entry as EntryModel}
        />
      </div>
    </Error >
  );
}

export default Entry;