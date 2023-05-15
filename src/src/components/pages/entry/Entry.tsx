import styles from './Entry.module.scss';

import Error from '../../layout/error/Error';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EntryLinks from '../../layout/entry-links/EntryLinks';
import { Nullable } from '../../../core/types/nullable.type';
import { Entry as EntryModel } from '../../../core/models/entry.model';
import { EntriesHelper } from '../../../core/helpers/firebase/entries.helper';



/**
 * @description
 * The entry detail page
 */
function Entry(): JSX.Element {
  const params = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Nullable<EntryModel>>(null);
  const entryId = useMemo(() => params.entryId, [params]);

  useEffect(() => {
    if (entryId?.length) {
      EntriesHelper.get(entryId).then(e => {
        setEntry(e);
      });
    }
  }, [entryId]);

  return (
    <Error error={!entry} message='Could not retrieve entry'>
      <div className={styles['root']}>
        <button onClick={() => navigate('/entries')}>back</button>
        <EntryLinks entry={entry as EntryModel} />
      </div>
    </Error >
  );
}

export default Entry;