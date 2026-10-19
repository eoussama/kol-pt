import type { IHistoryItem, THistoryKind } from "../../../hooks/history.hook";

import { useState } from "react";
import { openPost } from "../../../core/utils/links";
import { describeLeft, useHistory } from "../../../hooks/history.hook";
import { useAuthStore } from "../../../state/auth.state";
import Empty from "../../layout/generic/empty/Empty";
import Error from "../../layout/generic/error/Error";
import Search from "../../layout/generic/search/Search";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Skeleton } from "../../ui/skeleton";



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
    // Posts to continue always come with what is left and the time it was saved, so neither fallback is reachable
    /* v8 ignore next -- @preserve */
    return `${describeLeft(item.left ?? { reaction: 0, post: 0 })}${date ? ` ·${date}` : ""}`;
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
 * The filters, as the select lists them.
 */
const KIND_ITEMS = (Object.keys(KINDS) as Array<THistoryKind>).map(key => ({ value: key, label: KINDS[key].label }));

/**
 * @description
 * Placeholder rows shown while the history loads, shaped like the real rows.
 *
 * @returns The rendered placeholder list
 */
function HistorySkeleton(): JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading history" className="m-3 divide-y overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="aspect-video w-16 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

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

  const items = user ? history : [];

  return (
    <>
      <Search
        onSearch={onSearch}
        count={historyCount}
        countLabel={KINDS[kind].count}
        actions={(
          <>
            <Select
              value={kind}
              items={KIND_ITEMS}
              onValueChange={value => value && setKind(value)}
            >
              <SelectTrigger aria-label="Show" className="font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="end">
                {KIND_ITEMS.map(item => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      />

      <Error error={Boolean(user) && error} message="Could not load data">
        {user && loading
          ? <HistorySkeleton />
          : (
              <Empty message={emptyMessage}>
                {items.length > 0
                  ? [
                      <ul key="history" className="m-3 divide-y overflow-hidden rounded-xl border bg-card">
                        {items.map(item => (
                          <li key={`${item.post.id}/${item.tag.id}`}>
                            <button
                              type="button"
                              onClick={() => item.resumeAt === undefined ? openPost(item.post.id, item.tag.id) : openPost(item.post.id, undefined, item.resumeAt)}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                            >
                              <span className="relative aspect-video w-16 shrink-0 self-start overflow-hidden rounded-md bg-muted">
                                <img src={item.post.thumbnail} alt="" loading="lazy" className="size-full object-cover" />
                                {item.left && item.resumeAt !== undefined && (
                                  // How far into the post, like video sites show
                                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
                                    <span className="block h-full bg-primary" style={{ width: `${Math.min(100, (item.resumeAt / Math.max(1, item.resumeAt + item.left.post)) * 100)}%` }} />
                                  </span>
                                )}
                              </span>

                              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate text-sm font-medium">{item.tag.getTitle()}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                  {item.tag.entry ? `${item.tag.entry.getTypeName()} — ` : ""}
                                  {item.tag.getDetailDescription()}
                                  {" · "}
                                  {item.post.title}
                                </span>
                                <span className="truncate text-xs text-muted-foreground tabular-nums">{describeMarked(item, kind)}</span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>,
                    ]
                  : []}
              </Empty>
            )}
      </Error>
    </>
  );
}

export default HistoryPage;
