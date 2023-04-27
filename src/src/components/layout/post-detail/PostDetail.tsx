import styles from './PostDetail.module.scss';

import { Post } from '../../../core/models/post.model';



function PostDetail(props: { post: Post }) {
  const { post } = props;

  return <>
    <div className={styles['post']}>Post Detail - {post.id}</div>

    <ul>
      {post.tags.map(e => <li key={e.id}>{e.description}</li>)}
    </ul>
  </>
}

export default PostDetail;