import { List, Rows2 } from "lucide-react";
import { EViewMode } from "../../../core/enums/view-mode.enum";
import { cn } from "../../../core/utils/cn";
import { usePosts } from "../../../hooks/posts.hook";
import { useViewMode } from "../../../hooks/view-mode.hook";
import Empty from "../../layout/generic/empty/Empty";
import Error from "../../layout/generic/error/Error";
import Search from "../../layout/generic/search/Search";
import PostCard from "../../layout/post/post-card/PostCard";
import { Skeleton } from "../../ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "../../ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";



/**
 * @description
 * Placeholder cards shown while the posts load, shaped like the cards of the
 * current view mode.
 *
 * @param props - The skeleton's properties
 * @param props.compact - Whether the cards are shown in the compact view mode
 * @returns The rendered placeholder cards
 */
function FeedSkeleton({ compact }: { compact: boolean }): JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading posts" className={cn("flex flex-col p-3", compact ? "gap-2" : "gap-3")}>
      {Array.from({ length: compact ? 6 : 3 }, (_, i) => (
        compact
          ? (
              <div key={i} className="flex gap-3 rounded-xl border p-2">
                <Skeleton className="aspect-video w-24 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1.5 py-0.5">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-1/2 rounded-full" />
                </div>
              </div>
            )
          : (
              <div key={i} className="overflow-hidden rounded-xl border">
                <Skeleton className="aspect-2/1 w-full rounded-none" />
                <div className="flex flex-col gap-2 p-3">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            )
      ))}
    </div>
  );
}

/**
 * @description
 * The Feed component is responsible for rendering the list of posts in the main feed of the application.
 * It also provides the user with the option to switch between view modes (Expanded and Compact) and displays
 * the number of available streams.
 *
 * @returns JSX.Element
 */
function FeedPage(): JSX.Element {
  const { posts, error, loading, search, postsCount, onSearch } = usePosts();
  const { viewMode, setViewMode } = useViewMode();
  const compact = viewMode === EViewMode.COMPACT;
  const emptyMessage = postsCount > 0
    ? (
        <>
          No posts match
          {" "}
          <b>{search}</b>
        </>
      )
    : "No posts found";

  return (
    <>
      <Search
        onSearch={onSearch}
        count={postsCount}
        countLabel="Available Streams"
        actions={(
          <>
            <ToggleGroup
              spacing={0}
              variant="outline"
              aria-label="View mode"
              value={[compact ? "compact" : "expanded"]}
            >
              <Tooltip>
                <TooltipTrigger
                  render={<ToggleGroupItem value="expanded" aria-label="expanded" onClick={() => setViewMode(EViewMode.EXPANDED)} />}
                >
                  <Rows2 />
                </TooltipTrigger>
                <TooltipContent>Expanded</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={<ToggleGroupItem value="compact" aria-label="compact" onClick={() => setViewMode(EViewMode.COMPACT)} />}
                >
                  <List />
                </TooltipTrigger>
                <TooltipContent>Compact</TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </>
        )}
      />

      <Error error={error} message="Could not load data">
        {loading
          ? <FeedSkeleton compact={compact} />
          : (
              <Empty message={emptyMessage}>
                {posts.length > 0
                  ? [
                      <ul key="posts" className={cn("flex flex-col p-3", compact ? "gap-2" : "gap-3")}>
                        {posts.map(post => <li key={post.id}><PostCard post={post} viewMode={viewMode} /></li>)}
                      </ul>,
                    ]
                  : []}
              </Empty>
            )}
      </Error>
    </>
  );
}

export default FeedPage;
