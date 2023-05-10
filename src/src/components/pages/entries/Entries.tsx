import styles from './Entries.module.scss';

import Search from '../../layout/search/Search';
import { Chip, Tooltip } from '@mui/material';
import { useEntries } from '../../../hooks/entries.hook';
import PostError from '../../layout/post-error/PosrError';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import Empty from '../../empty/Empty';



/**
 * @description
 * The entries page, lists all available entries
 * on one place.
 */
function Entries(): JSX.Element {
  const { entries, error, loading, search, entriesCount, onSearch } = useEntries();
  const emptyMessage = entriesCount > 0 ? <>No posts match <b>{search}</b></> : 'No entries found';

  return (
    <>
      <Search
        onSearch={console.log}
        actions={
          <>
            <Tooltip title="Available Entries">
              <Chip className={styles['actions__count']} size='small' label={entriesCount} />
            </Tooltip>
          </>
        }
      />

      <ul className={styles['entries']}>
        <PostError error={error} message='Could not load data'>
          {loading
            ? <div className={styles['cards__loader']}>{<RestartAltOutlinedIcon />}</div>
            : <>
              <Empty message={emptyMessage}>
                {entries.map(post => <li key={post.id} className={styles['cards-wrapper']}>entry</li>)}
              </Empty>
            </>
          }
        </PostError>
      </ul>
    </>
  );
}

export default Entries;