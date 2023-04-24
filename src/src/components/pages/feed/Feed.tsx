import './Feed.scss';

import { useState } from 'react';
import { IPost } from '../../../core/types/post.type';
import { useEffectUnsafe } from '../../../core/effects/safe.effect';
import { PostsHelper } from '../../../core/helpers/posts.helper';



function Feed() {
  const [posts, setPosts] = useState<Array<IPost>>([]);

  useEffectUnsafe( () => {
    PostsHelper.load().then(setPosts);
  }, []);

  return (
    <>
      <h3>Feed</h3>
      <hr />
      <ul>
        {posts.map(e => <li key={e.id}>
          <div>{e.title}</div>
          <small>{e.description}</small>
        </li>)}
      </ul>
    </>
  );
}

export default Feed;
