import styles from './Feed.module.scss';

import { useState } from 'react';
import { usePosts } from '../../../hooks/posts.hook';
import Error from '../../layout/generic/error/Error';
import Empty from '../../layout/generic/empty/Empty';
import Search from '../../layout/generic/search/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Chip, IconButton, Tooltip } from '@mui/material';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import PostCard from '../../layout/post/post-card/PostCard';
import { ViewMode } from '../../../core/enums/view-mode.enum';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';



/**
 * @description
 * The Feed component is responsible for rendering the list of posts in the main feed of the application.
 * It also provides the user with the option to switch between view modes (Expanded and Compact) and displays
 * the number of available streams.
 *
 * @returns JSX.Element
*/
function Feed(): JSX.Element {
  const [viewMode, setViewMode] = useState(ViewMode.Expanded);
  const { posts, error, loading, search, postsCount, onSearch } = usePosts();

  const compactViewColor = viewMode === ViewMode.Compact ? 'primary' : 'default';
  const expandedViewColor = viewMode === ViewMode.Expanded ? 'primary' : 'default';
  const emptyMessage = postsCount > 0 ? <>No posts match <b>{search}</b></> : 'No posts found';

  return (
    <>
      <Search
        onSearch={onSearch}
        actions={
          <>
            <Tooltip title="Expanded">
              <IconButton color={expandedViewColor} size='small' aria-label="expanded" onClick={() => setViewMode(ViewMode.Expanded)}>
                <ViewStreamIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Compact">
              <IconButton color={compactViewColor} size='small' aria-label="compact" onClick={() => setViewMode(ViewMode.Compact)}>
                <ViewListIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Available Streams">
              <Chip className={styles['actions__count']} size='small' label={postsCount} />
            </Tooltip>
          </>
        }
      />

      <ul className={styles['cards']}>
        <Error error={error} message='Could not load data'>
          {loading
            ? <div className={styles['cards__loader']}>{<RestartAltOutlinedIcon />}</div>
            : <>
              <Empty message={emptyMessage}>
                {posts.map(post => <li key={post.id} className={styles['cards-wrapper']}><PostCard post={post} viewMode={viewMode} /></li>)}
              </Empty>
            </>
          }
        </Error>
      </ul>
    </>
  );
}

export default Feed;
