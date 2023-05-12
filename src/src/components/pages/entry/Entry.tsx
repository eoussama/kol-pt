import styles from './Entry.module.scss';

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';



/**
 * @description
 * The entry detail page
 */
function Entry(): JSX.Element {
  const params = useParams();
  const entryId = useMemo(() => params.entryId, [params]);

  return (
    <div className={styles['root']}>
      Entry {entryId}
    </div>
  );
}

export default Entry;