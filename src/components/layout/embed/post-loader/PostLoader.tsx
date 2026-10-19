import { Skeleton } from "../../../ui/skeleton";



/**
 * @description
 * The post's loader component, displayed
 * as a placeholder until the details are loaded: the shape of the panel.
 *
 * @returns The rendered post loader placeholder
 */
function PostLoader(): JSX.Element {
  return (
    <div role="status" className="overflow-hidden rounded-xl border bg-card">
      <span className="sr-only">Loading post info...</span>

      <div className="flex items-center gap-2 px-3 py-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="ml-auto size-7 rounded-md" />
      </div>

      {[0, 1].map(row => (
        <div key={row} className="flex items-center gap-3 border-t px-3 py-3">
          <Skeleton className="size-4 rounded-[4px]" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default PostLoader;
