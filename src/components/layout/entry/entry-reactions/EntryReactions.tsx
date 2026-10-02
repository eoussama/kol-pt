import type { IReaction } from "../../../../core/domain/hydrate";
import type { IEntryPageReactionsSectionProps } from "../../../../core/types/props/entry-reactions.props.type";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, InputAdornment, InputBase, Tooltip } from "@mui/material";
import { openPost } from "../../../../core/utils/links";
import { useSearch } from "../../../../hooks/search.hook";

import styles from "./EntryReactions.module.scss";



/**
 * @description
 * What a reaction is searched by: its description and its date.
 *
 * @param reaction - The reaction
 * @returns The text to search in
 */
function toSearchText(reaction: IReaction): string {
  return `${reaction.tag.getDetailDescription()} ${reaction.tag.label} ${reaction.date.toLocaleDateString()}`;
}

/**
 * @description
 * Renders the entry related reactions, searchable.
 *
 * @param props - The component's properties
 * @returns The rendered reactions list section, or nothing when the entry has no reactions
 */
function EntryReactions(props: IEntryPageReactionsSectionProps): JSX.Element | null {
  const { reactions } = props;
  const { search, filtered, onSearch } = useSearch(reactions, toSearchText);

  /**
   * @description
   * Redirects user to watch a specific reaction.
   *
   * @param reaction The reaction to watch.
   */
  const onWatch = (reaction: IReaction) => {
    openPost(reaction.postId, reaction.tag.id);
  };

  if (reactions.length === 0) {
    return null;
  }

  return (
    <div className={styles["entry-reactions"]}>
      <div className={styles.title}>Reactions</div>

      {reactions.length > 1 && (
        <InputBase
          type="search"
          onChange={onSearch}
          placeholder="Search reactions..."
          className={styles.search}
          inputProps={{ "aria-label": "Search reactions" }}
          startAdornment={<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>}
        />
      )}

      {filtered.length === 0 && search.trim() && (
        <div className={styles.empty}>
          No reactions match
          {" "}
          <b>{search.trim()}</b>
        </div>
      )}

      <ul className={styles.reactions}>
        {filtered.map((reaction, i) => (
          <li
            key={i}
            className={styles.reaction}
          >
            <div className={styles.reaction__left}>
              <div className={styles.reaction__title}>
                {reaction.tag.getDetailDescription()}
              </div>

              <div className={styles.reaction__date}>
                {reaction.date.toLocaleDateString()}
              </div>
            </div>

            <div className={styles.reaction__right}>
              <Tooltip title="Watch reaction">
                <IconButton
                  size="small"
                  aria-label="restart reaction"
                  className={styles.reaction__skip}
                  onClick={() => onWatch(reaction)}
                >
                  <PlayArrowIcon />
                </IconButton>
              </Tooltip>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EntryReactions;
