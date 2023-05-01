import styles from './PostCard.module.scss';

import { Post } from '../../../core/models/post.model';
import { ViewMode } from '../../../core/enums/view-mode.enum';
import { IPostCardProps } from '../../../core/types/props/post-card-props.type';
import { Box, Card, CardContent, CardMedia, Chip, Tooltip, Typography } from '@mui/material';



/**
 * @description
 * Renders a card for displaying a post, with an image, title, date, description and tags.
 */
function PostCard(props: IPostCardProps): JSX.Element {
  const { post } = props;
  const { viewMode } = props;

  const viewModeClasses = viewMode === ViewMode.Compact ? styles['card--compact'] : styles['card--expanded'];
  const cardClasses = `${styles['card']} ${viewModeClasses}`

  /**
   * @description
   * Opens the post in a new window when the card is clicked.
   *
   * @param post The post to open.
   */
  const goToPost = (post: Post) => {
    window.open(`https://www.patreon.com/posts/${post.id}`, '_blank');
  }

  return (
    <>
      <Card sx={{ display: 'flex' }} className={cardClasses} onClick={() => goToPost(post)}>
        <CardMedia
          component="img"
          alt={post.title}
          image={post.thumbnail}
          className={styles['card__thumbnail']}
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
                <Chip className={styles['tag']} size='small' label={tag.getMinTitle()} />
              </Tooltip>
            </Box>)}
          </div>
        </Box>
      </Card>
    </>
  );
}

export default PostCard;
