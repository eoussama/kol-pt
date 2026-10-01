import type { IHistoryItem, THistoryKind } from "../../../hooks/history.hook";

import { Chip, CircularProgress, Divider, List, ListItem, MenuItem, Select, Tooltip } from "@mui/material";
import { useState } from "react";
import { openPost } from "../../../core/utils/links";
import { formatTimestamp } from "../../../core/utils/time";
import { useHistory } from "../../../hooks/history.hook";
import { useAuthStore } from "../../../state/auth.state";
import Empty from "../../layout/generic/empty/Empty";
import Error from "../../layout/generic/error/Error";
import Search from "../../layout/generic/search/Search";
import { ListItemText } from "../../styled/ListItemText";

import styles from "./HistoryPage.module.scss";



/**
 * @description
 * Describes when a reaction was watched or favorited.
 *
 * @param item - The reaction
 * @param kind - Whether it is listed as watched, as a favorite or to continue
 * @returns The date, or a note for reactions without one
 */
function describeMarked(item: IHistoryItem, kind: THistoryKind): string {
  const date = item.markedAt
    ? ` ${item.markedAt.toLocaleDateString()} at ${item.markedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "";

  if (kind === "continue") {
    return `Left off at ${formatTimestamp(item.resumeAt ?? 0)}${date ? ` ·${date}` : ""}`;
  }

  return `${kind === "watched" ? "Watched" : "Favorited"}${date}`;
}

/**
 * @description
 * What each filter lists, for the count's tooltip and the empty state.
 */
const KINDS: Record<THistoryKind, { label: string; count: string; empty: string }> = {
  watched: { label: "Watched", count: "Watched Reactions", empty: "Reactions you watch will show up here" },
  favorites: { label: "Favorites", count: "Favorite Reactions", empty: "Reactions you favorite will show up here" },
  continue: { label: "Continue", count: "Posts to Continue", empty: "Posts you stop watching partway will show up here" },
};

/**
 * @description
 * The history page: the reactions the signed-in user watched or favorited,
 * and the posts they can continue, most recent first. Opening one plays it
 * on Patreon.
 *
 * @returns The rendered history page
 */
function HistoryPage(): JSX.Element {
  const user = useAuthStore(e => e.user);
  const [kind, setKind] = useState<THistoryKind>("watched");
  const { history, error, loading, search, historyCount, onSearch } = useHistory(kind);

  const emptyMessage = !user
    ? "Login to keep a history of the reactions you watch and favorite"
    : historyCount > 0
      ? (
          <>
            No reactions match
            {" "}
            <b>{search}</b>
          </>
        )
      : KINDS[kind].empty;

  return (
    <>
      <Search
        onSearch={onSearch}
        actions={(
          <div className={styles.actions}>
            <Select
              size="small"
              value={kind}
              variant="standard"
              disableUnderline
              className={styles.filter}
              inputProps={{ "aria-label": "Show" }}
              onChange={e => setKind(e.target.value)}
            >
              {(Object.keys(KINDS) as Array<THistoryKind>).map(key => (
                <MenuItem key={key} value={key} dense>{KINDS[key].label}</MenuItem>
              ))}
            </Select>
            <Tooltip title={KINDS[kind].count}>
              <Chip size="small" label={historyCount} />
            </Tooltip>
          </div>
        )}
      />

      <List className={styles.history}>
        <Error error={Boolean(user) && error} message="Could not load data">
          {user && loading
            ? <div className={styles.history__loader}><CircularProgress /></div>
            : (
                <Empty message={emptyMessage}>
                  {(user ? history : []).map(item => (
                    <div key={`${item.post.id}/${item.tag.id}`}>
                      <ListItem className={styles.item} onClick={() => item.resumeAt === undefined ? openPost(item.post.id, item.tag.id) : openPost(item.post.id, undefined, item.resumeAt)}>
                        <ListItemText
                          primary={item.tag.getTitle()}
                          className={styles.item__detail}
                          secondary={(
                            <>
                              <span className={styles.item__line}>
                                {item.tag.entry ? `${item.tag.entry.getTypeName()} — ` : ""}
                                {item.tag.getDetailDescription()}
                                {" · "}
                                {item.post.title}
                              </span>
                              <span className={styles.item__line}>{describeMarked(item, kind)}</span>
                            </>
                          )}
                        />
                      </ListItem>
                      <Divider component="li" />
                    </div>
                  ))}
                </Empty>
              )}
        </Error>
      </List>
    </>
  );
}

export default HistoryPage;
