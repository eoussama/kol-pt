import styles from './Feed.module.scss';

import { useState } from 'react';
import { Chip, IconButton, Tooltip } from '@mui/material';
import PostCard from '../../layout/card/PostCard';
import { Post } from '../../../core/models/post.model';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import { ViewMode } from '../../../core/enums/view-mode.enum';
import { PostsHelper } from '../../../core/helpers/posts.helper';
import { useEffectUnsafe } from '../../../core/effects/safe.effect';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';



function Feed() {
  const [viewMode, setViewMode] = useState(ViewMode.Expanded);
  const [posts, setPosts] = useState<Array<Post>>([]);
  const [loading, setLoading] = useState(false);

  const compactViewColor = viewMode === ViewMode.Compact ? 'primary' : 'default';
  const expandedViewColor = viewMode === ViewMode.Expanded ? 'primary' : 'default';

  useEffectUnsafe(() => {
    setLoading(true);

    PostsHelper.load()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h3 className={styles['title']}>
        <span>Feed</span>

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
        {loading && <div className={styles['cards__loader']}>{<RestartAltOutlinedIcon />}</div>}
        {posts.map(post => <li key={post.id} className={styles['cards-wrapper']}><PostCard post={post} viewMode={viewMode} /></li>)}
      </ul >
    </>
  );
}

export default Feed;
