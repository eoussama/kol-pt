import type { Entry } from "../../../core/domain/entry";
import type { YouTube } from "../../../core/domain/youtube";

import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { EPage } from "../../../core/enums/page.enum";
import { useEntries } from "../../../hooks/entries.hook";
import Empty from "../../layout/generic/empty/Empty";
import Error from "../../layout/generic/error/Error";
import Search from "../../layout/generic/search/Search";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Skeleton } from "../../ui/skeleton";



/**
 * @description
 * Placeholder rows shown while the entries load, shaped like the real rows.
 *
 * @returns The rendered placeholder list
 */
function EntriesSkeleton(): JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading entries" className="m-3 divide-y overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * @description
 * The entries page, lists all available entries
 * on one place.
 *
 * @returns The rendered entries list page
 */
function EntriesPage(): JSX.Element {
  const navigate = useNavigate();
  const { entries, error, loading, search, entriesCount, onSearch } = useEntries();
  const emptyMessage = entriesCount > 0
    ? (
        <>
          No entries match
          {" "}
          <b>{search}</b>
        </>
      )
    : "No entries found";

  /**
   * @description
   * Handles entry detail navigation
   *
   * @param entryId The entry ID to navigate to
   */
  const onEntryClick = (entryId: string) => {
    navigate(`/${EPage.ENTRY}/${entryId}`);
  };

  /**
   * @description
   * Returns the proper entry subtitle.
   *
   * @param entry - The target entry
   * @returns The subtitle string for the entry
   */
  const getSubtitle = (entry: Entry) => {
    switch (entry.type) {
      case EEntryType.YOUTUBE: return `@${(entry as YouTube).handle}`;

      default: return entry.altTitles.join(", ");
    }
  };

  return (
    <>
      <Search
        onSearch={onSearch}
        count={entriesCount}
        countLabel="Available Entries"
      />

      <Error error={error} message="Could not load data">
        {loading
          ? <EntriesSkeleton />
          : (
              <Empty message={emptyMessage}>
                {entries.length > 0
                  ? [
                      <ul key="entries" className="m-3 divide-y overflow-hidden rounded-xl border bg-card">
                        {entries.map(entry => (
                          <li key={entry.id}>
                            <button
                              type="button"
                              onClick={() => onEntryClick(entry.id)}
                              className="group/entry flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                            >
                              <Avatar className="size-9 rounded-lg after:rounded-lg">
                                <AvatarImage src={entry.cover} alt="" className="rounded-lg" />
                                <AvatarFallback className="rounded-lg text-xs font-semibold">
                                  {entry.getTypeName()[0]}
                                </AvatarFallback>
                              </Avatar>

                              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate text-sm font-medium">{entry.title}</span>
                                {getSubtitle(entry) && (
                                  <span className="truncate text-xs text-muted-foreground">{getSubtitle(entry)}</span>
                                )}
                              </span>

                              <Badge variant="outline" className="text-muted-foreground">{entry.getTypeName()}</Badge>
                              <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover/entry:translate-x-0.5 motion-reduce:transition-none" />
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

export default EntriesPage;
