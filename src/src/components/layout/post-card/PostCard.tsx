import styles from './PostCard.module.scss';

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
   */
  const goToPost = () => {
    window.open(`https://www.patreon.com/posts/${post.id}`, '_blank');
  }

  /**
   * @description
   * Opens the post in a new window and plays specific reaction
   *
   * @param e The mouse click event
   * @param reactionId The id of the reaction
   */
  const goToReaction = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, reactionId: string) => {
    e.stopPropagation();
    e.preventDefault();

    window.open(`https://www.patreon.com/posts/${post.id}?reactionId=${reactionId}`, '_blank');
  }

  return (
    <>
      <Card sx={{ display: 'flex' }} className={cardClasses} onClick={() => goToPost()}>
        <CardMedia
          component="img"
          alt={post.title}
          image={post.thumbnail}
          className={styles['card__thumbnail']}
        />

        <CardContent sx={{ flex: '1 0 auto' }} className={styles['card__body']}>
          <div className={styles['card__info']}>
            <Typography component="div" variant="h5" className={styles['card__title']}>
              {post.title}
            </Typography>

            <Typography variant="subtitle1" color="text.secondary" className={styles['card__subtitle']} component="div">
              {post.creationDate.toLocaleString()}
            </Typography>

            <Typography variant="subtitle1" color="text.secondary" className={styles['card__description']} component="div">
              {post.description}
            </Typography>
          </div>

          <div className={styles['card__tags']}>
            {post.tags.map(tag => <Box key={tag.id} ml={1}>
              <Tooltip title={tag.description}>
                <Chip
                  size='small'
                  className={styles['tag']}
                  label={tag.getMinTitle()}
                  onClick={e => goToReaction(e, tag.id)}
                />
              </Tooltip>
            </Box>)}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default PostCard;
