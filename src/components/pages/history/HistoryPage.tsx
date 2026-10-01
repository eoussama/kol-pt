import type { IHistoryItem, THistoryKind } from "../../../hooks/history.hook";

import { Chip, CircularProgress, Divider, List, ListItem, Tooltip } from "@mui/material";
import { useState } from "react";
import { openPost } from "../../../core/utils/links";
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
 * @param kind - Whether it is listed as watched or as a favorite
 * @returns The date, or a note for reactions without one
 */
function describeMarked(item: IHistoryItem, kind: THistoryKind): string {
  const label = kind === "watched" ? "Watched" : "Favorited";

  return item.markedAt
    ? `${label} ${item.markedAt.toLocaleDateString()} at ${item.markedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : label;
}

/**
 * @description
 * The history page: the reactions the signed-in user watched, most recent
 * first. Opening one plays it on Patreon.
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
      : (kind === "watched" ? "Reactions you watch will show up here" : "Reactions you favorite will show up here");

  return (
    <>
      <Search
        onSearch={onSearch}
        actions={(
          <div className={styles.actions}>
            <Chip
              size="small"
              label="Watched"
              onClick={() => setKind("watched")}
              color={kind === "watched" ? "primary" : "default"}
            />
            <Chip
              size="small"
              label="Favorites"
              onClick={() => setKind("favorites")}
              color={kind === "favorites" ? "primary" : "default"}
            />
            <Tooltip title={kind === "watched" ? "Watched Reactions" : "Favorite Reactions"}>
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
                      <ListItem className={styles.item} onClick={() => openPost(item.post.id, item.tag.id)}>
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
