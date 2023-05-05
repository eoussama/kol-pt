import styles from './Feed.module.scss';

import { useEffect, useState } from 'react';
import PostCard from '../../layout/post-card/PostCard';
import ViewListIcon from '@mui/icons-material/ViewList';
import { usePostStore } from '../../../state/posts.state';
import PostError from '../../layout/post-error/PosrError';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import { ViewMode } from '../../../core/enums/view-mode.enum';
import { Chip, IconButton, InputBase, Tooltip } from '@mui/material';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import { Post } from '../../../core/models/post.model';



/**
 * @description
 * The Feed component is responsible for rendering the list of posts in the main feed of the application. It also provides the user with the option to switch between view modes (Expanded and Compact) and displays the number of available streams.
 *
 * @returns JSX.Element
*/
function Feed(): JSX.Element {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState(ViewMode.Expanded);
  const { posts, error, loading, loadPosts } = usePostStore();
  const [filteredPosts, setFilteredPosts] = useState<Array<Post>>([]);

  const compactViewColor = viewMode === ViewMode.Compact ? 'primary' : 'default';
  const expandedViewColor = viewMode === ViewMode.Expanded ? 'primary' : 'default';

  /**
   * @description
   * Handles list search
   *
   * @param e The search event object
   */
  const onSearch = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = (e.target.value ?? '').toLowerCase();
    setSearch(value);
  }

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    setFilteredPosts(posts.filter(post =>
      post.title.toLowerCase().includes(search)
      || post.description.toLowerCase().includes(search)
      || post.creationDate.toLocaleString().includes(search)
      || post.tags.some(tag =>
        tag.label.toString().toLowerCase().includes(search)
        || tag.description.toLowerCase().includes(search)
        || tag.entry.title.toLowerCase().includes(search)
        || tag.entry.shortTitle.toLowerCase().includes(search)
        || tag.entry.altTitles.some(altTitle => altTitle.toLowerCase().includes(search))
      )
    ));
  }, [search]);

  return (
    <>
      <h3 className={styles['title']}>
        <span className={styles['title__search']}>
          <InputBase
            size="small"
            type='search'
            onChange={onSearch}
            placeholder='Search...'
            className={styles['search']}
          />
        </span>

        <div className={styles['title__actions']}>
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

          <Tooltip title="Available streams">
            <Chip className={styles['title__count']} size='small' label={posts.length} />
          </Tooltip>
        </div>
      </h3>

      <ul className={styles['cards']}>
        <PostError error={error} message='Could not load data'>
          {loading
            ? <div className={styles['cards__loader']}>{<RestartAltOutlinedIcon />}</div>
            : <>{filteredPosts.map(post => <li key={post.id} className={styles['cards-wrapper']}><PostCard post={post} viewMode={viewMode} /></li>)}</>
          }
        </PostError>
      </ul >
    </>
  );
}

export default Feed;
