import './Feed.scss';

import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { get, getDatabase, ref } from 'firebase/database';
import { config } from '../../config/env';
import { IPost } from '../../core/types/post.type';



function Feed() {
  const [posts, setPosts] = useState<Array<IPost>>([]);

  useEffect(() => {
    const app = initializeApp(config);
    const database = getDatabase(app);

    get(ref(database, 'posts')).then(e => setPosts(e.val()));
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
