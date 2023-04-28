import styles from './PostDetail.module.scss';

import { useMemo } from 'react';
import { Post } from '../../../core/models/post.model';
import { TimeHelper } from '../../../core/helpers/parse/time.helper';



function PostDetail(props: { post: Post }) {
  const { post } = props;

  return <>
    <div className={styles['post']}>
      <div className={styles['post__body']}>
        <ul className={styles['reactions']}>
          {post.tags.map(tag => <li key={tag.id} className={styles['reaction']}>
            <div className={styles['reaction__title']}>
              {tag.entry.title}
            </div>

            <div className={styles['reaction__description']}>
              {tag.getDetailDescription()}

              <span className={styles['reaction__extra']}>
                , {tag.getDetailExtra()}
              </span>
            </div>
          </li>)}
        </ul>
      </div>
    </div>

  </>
}

export default PostDetail;