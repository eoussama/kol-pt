import styles from './Feed.module.scss';

import { useState } from 'react';
import { Chip } from '@mui/material';
import PostCard from '../../layout/card/PostCard';
import { Post } from '../../../core/models/post.model';
import { PostsHelper } from '../../../core/helpers/posts.helper';
import { useEffectUnsafe } from '../../../core/effects/safe.effect';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';



function Feed() {
  const [posts, setPosts] = useState<Array<Post>>([]);
  const [loading, setLoading] = useState(false);

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
        <Chip className={styles['title__count']} size='small' label={posts.length} />
      </h3>

      <ul className={styles['cards']}>
        {loading && <div className={styles['cards__loader']}>{<RestartAltOutlinedIcon />}</div>}
        {posts.map(post => <li key={post.id} className={styles['cards-wrapper']}><PostCard post={post} /></li>)}
      </ul >
    </>
  );
}

export default Feed;
