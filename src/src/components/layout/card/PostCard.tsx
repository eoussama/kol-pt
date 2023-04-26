import styles from './PostCard.module.scss';

import { Box, Card, CardContent, CardMedia, Chip, Tooltip, Typography } from '@mui/material';
import { Post } from '../../../core/models/post.model';
import { Tag } from '../../../core/models/tag.model';



function PostCard(props: { post: Post }) {
  const { post } = props;
  const goToPost = (post: Post) => {
    window.open(`https://www.patreon.com/posts/${post.id}`, '_blank');
  }

  const getLabel = (tag: Tag) => {
    return `${tag.entry?.shortTitle} - ${tag.label}`;
  }

  return (
    <>
      <Card sx={{ display: 'flex' }} className={styles['card']} onClick={() => goToPost(post)}>
        <CardMedia
          component="img"
          sx={{ width: 120 }}
          image={post.thumbnail}
          alt={post.title}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: '1 0 auto' }} className={styles['card__body']}>
            <Typography component="div" variant="h5" className={styles['card__title']}>
              {post.title}
            </Typography>

            <Typography variant="subtitle1" color="text.secondary" className={styles['card__subtitle']} component="div">
              {post.creationDate.toLocaleString()}
            </Typography>

            <Typography variant="subtitle1" color="text.secondary" className={styles['card__description']} component="div">
              {post.description}
            </Typography>
          </CardContent>

          <div className={styles['card__tags']}>
            {post.tags.map(tag => <Box key={tag.id} ml={1}>
              <Tooltip title={tag.description}>
                <Chip className={styles['tag']} size='small' label={getLabel(tag)} />
              </Tooltip>
            </Box>)}
          </div>
        </Box>
      </Card>
    </>
  );
}

export default PostCard;
