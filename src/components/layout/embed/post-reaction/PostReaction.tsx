import type { Tag } from "../../../../core/domain/tag";
import type { IPostReactionProps } from "../../../../core/types/props/post-reaction-props.type";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FlagIcon from "@mui/icons-material/Flag";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import { Chip, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { useContext } from "react";
import { usePlayer } from "../../../../content/player/PlayerProvider";
import { useModeration } from "../../../../context/ModerationContext";
import { PostContext } from "../../../../context/PostContext";
import { ReactionOverlayContext } from "../../../../context/ReactionOverlayContext";
import { useAuthStore } from "../../../../state/auth.state";
import { useFavoritesStore, usePostFavorites } from "../../../../state/favorites.state";
import { selectReports, useReportsStore } from "../../../../state/reports.state";
import { usePostWatchlist, useWatchlistStore } from "../../../../state/watchlist.state";
import { Checkbox } from "../../../styled/Checkbox";

import styles from "./PostReaction.module.scss";



/**
 * @description
 * A React component that renders a single post reaction with skip and more buttons.
 *
 * @param props - The props object containing the necessary properties to render the component
 * @returns The rendered post reaction item
 */
function PostReaction(props: IPostReactionProps): JSX.Element {
  const { tag } = props;
  const user = useAuthStore(e => e.user);
  const { post } = useContext(PostContext);
  const { isWatched, saving, isSaving } = usePostWatchlist(post.id);
  const watched = isWatched(tag.id);
  const savingThis = isSaving(tag.id);
  const favorites = usePostFavorites(post.id);
  const favorite = favorites.isFavorite(tag.id);
  const toggleFavorite = useFavoritesStore(e => e.toggle);
  const toggleWatched = useWatchlistStore(e => e.toggle);
  const { playing, currentTime, playFrom } = usePlayer();
  const { setAnchorOpened, setAnchorEl, setTag, setDialogOpened } = useContext(ReactionOverlayContext);
  const moderator = useAuthStore(e => e.moderator);
  const allReports = useReportsStore(e => e.reports);
  const reports = moderator ? selectReports(allReports, post.id, tag.id) : [];
  const { review } = useModeration();

  // Signed-in viewers can always report, so the menu is there for them
  const hasMore = Boolean(tag.entry) || Boolean(user);

  /**
   * @description
   * Checks if user is logged in
   *
   * @returns True if user is authenticated
   */
  const isLoggedIn = () => {
    return Boolean(user);
  };

  /**
   * @description
   * Checks whether the associated reaction is currently being played
   *
   * @returns True if the reaction is currently playing
   */
  const isPlaying = () => {
    return currentTime > 0 && tag.startTime <= currentTime && currentTime <= tag.endTime;
  };

  /**
   * @description
   * Opens detail page as a modal about the selected tag.
   *
   * @param tag The target tag to show the detail of.
   */
  const onDetail = (tag: Tag) => {
    setTag(tag);
    setDialogOpened(true);
  };

  /**
   * @description
   * Triggers the more menu
   *
   * @param event The mouse clicked event, provides extra content for the Mui menu
   * @param tag The tag to show the menu for
   */
  const onMore = (event: React.MouseEvent<HTMLElement>, tag: Tag) => {
    setTag(tag);
    setAnchorEl(event.currentTarget);
    setAnchorOpened(true);
  };

  return (
    <>
      <li key={tag.id} className={styles.reaction}>
        {isLoggedIn()
          && (
            <div className={styles.reaction__tracking}>
              {savingThis
                ? <CircularProgress size={20} aria-label="Saving" className={styles.reaction__saving} />
                : (
                    <Tooltip title={watched ? "Mark as un-watched" : "Mark as watched"}>
                      <span>
                        <Checkbox
                          checked={watched}
                          disabled={saving}
                          className={styles.reaction__checkbox}
                          onChange={e => toggleWatched(post.id, tag.id, e.target.checked)}
                        />
                      </span>
                    </Tooltip>
                  )}
            </div>
          )}

        <div className={styles.reaction__left}>
          <div className={styles.reaction__title}>
            {tag.getTitle()}
            {isPlaying() && (
              <Chip
                size="small"
                label={playing ? "Playing" : "Paused"}
                className={styles.reaction__playing}
              />
            )}
            {reports.length > 0 && (
              <Chip
                size="small"
                color="warning"
                icon={<FlagIcon />}
                label={reports.length}
                aria-label={`${reports.length} open reports`}
                className={styles.reaction__reports}
                onClick={() => review(tag.id)}
              />
            )}
          </div>

          <div className={styles.reaction__description}>
            {tag.entry && (
              <>
                <span className={styles.reaction__type}>
                  {tag.entry.getTypeName()}
                </span>

                {" — "}
              </>
            )}
            {tag.getDetailDescription()}

            <span className={styles.reaction__extra}>
              , Starts at
              {" "}
              <span
                className={styles.reaction__highlight}
                onClick={() => playFrom(tag.startTime)}
              >
                {tag.getReadableStartTime()}
              </span>
              , Duration:
              {" "}
              {tag.getReadableDuration()}
            </span>
          </div>
        </div>

        <div className={styles.reaction__right}>
          {!isPlaying() && (
            <Tooltip title="Skip to reaction">
              <IconButton
                size="small"
                aria-label="skip to reaction"
                className={styles.reaction__skip}
                onClick={() => playFrom(tag.startTime)}
              >
                <PlayArrowIcon />
              </IconButton>
            </Tooltip>
          )}

          {isPlaying() && (
            <Tooltip title="Restart reaction">
              <IconButton
                size="small"
                aria-label="restart reaction"
                className={styles.reaction__skip}
                onClick={() => playFrom(tag.startTime)}
              >
                <ReplayIcon />
              </IconButton>
            </Tooltip>
          )}

          {tag.entry && (
            <Tooltip title="Detail">
              <IconButton
                size="small"
                aria-label="detail"
                onClick={() => onDetail(tag)}
              >
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          )}

          {isLoggedIn() && (
            <div className={[styles.reaction__favorite, favorite && styles["reaction__favorite--on"], favorite && hasMore && styles["reaction__favorite--shifted"]].filter(Boolean).join(" ")}>
              {favorites.isSaving(tag.id)
                ? <CircularProgress size={18} aria-label="Saving" className={styles.reaction__saving} />
                : (
                    <Tooltip title={favorite ? "Remove from favorites" : "Add to favorites"}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={favorites.saving}
                          aria-pressed={favorite}
                          aria-label={favorite ? "remove from favorites" : "add to favorites"}
                          onClick={() => toggleFavorite(post.id, tag.id, !favorite)}
                          className={favorite ? styles.reaction__heart : undefined}
                        >
                          {favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
            </div>
          )}

          {hasMore && (
            <Tooltip title="More">
              <IconButton
                size="small"
                aria-label="more"
                onClick={e => onMore(e, tag)}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>

      </li>
    </>
  );
}

export default PostReaction;
