import type { IHistoryItem } from "../../../hooks/history.hook";

import { Chip, CircularProgress, Divider, List, ListItem, Tooltip } from "@mui/material";
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
 * Describes when a reaction was watched.
 *
 * @param item - The watched reaction
 * @returns The watch date, or a note for reactions without one
 */
function describeWatched(item: IHistoryItem): string {
  return item.watchedAt
    ? `Watched ${item.watchedAt.toLocaleDateString()} at ${item.watchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Watched";
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
  const { history, error, loading, search, historyCount, onSearch } = useHistory();

  const emptyMessage = !user
    ? "Login to keep a history of the reactions you watch"
    : historyCount > 0
      ? (
          <>
            No reactions match
            {" "}
            <b>{search}</b>
          </>
        )
      : "Reactions you watch will show up here";

  return (
    <>
      <Search
        onSearch={onSearch}
        actions={(
          <Tooltip title="Watched Reactions">
            <Chip className={styles.actions__count} size="small" label={historyCount} />
          </Tooltip>
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
                              <span className={styles.item__line}>{describeWatched(item)}</span>
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
