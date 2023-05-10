import styles from './Entries.module.scss';

import Search from '../../layout/search/Search';
import { Chip, Tooltip } from '@mui/material';



/**
 * @description
 * The entries page, lists all available entries
 * on one place.
 */
function Entries(): JSX.Element {
  return (
    <>
      <Search
        onSearch={console.log}
        actions={
          <>
            <Tooltip title="Available Entries">
              <Chip className={styles['actions__count']} size='small' label={0} />
            </Tooltip>
          </>
        }
      />
    </>
  );
}

export default Entries;