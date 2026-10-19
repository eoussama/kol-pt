import type { IEntryViewProps } from "../../../core/types/props/entry-page-props.type";

import { useState } from "react";
import { getPlaceholderUrl } from "../../../core/utils/assets";
import { cn } from "../../../core/utils/cn";
import { useCoverImage } from "../../../hooks/cover-image.hook";
import { useDelayed } from "../../../hooks/delayed.hook";
import { useEntry } from "../../../hooks/entry.hook";
import EntryAka from "../../layout/entry/entry-aka/EntryAka";
import EntryHead from "../../layout/entry/entry-head/EntryHead";
import EntryLinks from "../../layout/entry/entry-links/EntryLinks";
import EntryReactions from "../../layout/entry/entry-reactions/EntryReactions";
import Error from "../../layout/generic/error/Error";
import { Skeleton } from "../../ui/skeleton";



/**
 * @description
 * The entry detail's shape while it loads: the cover, head, aliases, links
 * and reactions, where they will be.
 *
 * @param props - How the entry is shown
 * @param props.isDialog - Whether it is shown in a dialog, with its links side by side
 * @returns The skeleton
 */
function EntrySkeleton(props: { isDialog: boolean }): JSX.Element {
  return (
    <div role="status" aria-label="Loading entry" className="flex flex-col gap-5 pb-5">
      {/* Fades into the page like the cover does, under the head that overlaps it */}
      <Skeleton className="h-44 w-full rounded-none [mask-image:linear-gradient(to_bottom,black_45%,transparent)]" />

      <div className="-mt-16 flex flex-col gap-2 px-4">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-6 w-3/4" />
        <div className="mt-1 flex flex-col gap-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="mt-1 flex gap-1">
          {["w-14", "w-16", "w-12", "w-18"].map(width => <Skeleton key={width} className={cn("h-5 rounded-full", width)} />)}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4">
        <Skeleton className="h-4 w-16" />
        <div className="flex flex-wrap gap-1.5">
          {["w-36", "w-28", "w-32"].map(width => <Skeleton key={width} className={cn("h-7 rounded-full", width)} />)}
        </div>
      </div>

      <div className={cn("grid gap-2 px-4", props.isDialog && "grid-cols-2")}>
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>

      <div className="flex flex-col gap-2 px-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="divide-y overflow-hidden rounded-xl border">
          {[0, 1].map(row => (
            <div key={row} className="flex flex-col gap-1.5 px-3 py-2.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * @description
 * How long an entry may take to load before its skeleton shows, in
 * milliseconds. Entries cached by the background load faster than that.
 */
const SKELETON_DELAY_MS = 200;

/**
 * @description
 * The entry detail, shown as a popup page and as a dialog on Patreon.
 * It does not depend on a router. It shows its skeleton until the entry and
 * its details from other sites are in (unless they are in quickly), then
 * appears at once, so nothing moves as they arrive; a cover not seen before
 * fades in once loaded.
 *
 * @param props - The entry to show, and how it is shown
 * @returns The rendered entry detail
 */
function EntryView(props: IEntryViewProps): JSX.Element {
  const { entryId, isDialog = false, onBack } = props;
  const { loading, entry, description, photo, subscribers, altTitles, genres, reactions } = useEntry(entryId);
  const coverImage = useCoverImage(photo);
  const slow = useDelayed(loading, SKELETON_DELAY_MS);
  const [coverShown, setCoverShown] = useState(() => coverImage !== null);
  const [coverFailed, setCoverFailed] = useState(false);

  const cover = coverFailed || !photo ? getPlaceholderUrl() : coverImage;

  if (loading) {
    return slow ? <EntrySkeleton isDialog={isDialog} /> : <div role="status" aria-label="Loading entry" className="min-h-44" />;
  }

  if (!entry) {
    return <Error error={true} message="Could not retrieve entry" />;
  }

  return (
    <div className="relative isolate flex animate-in flex-col gap-5 pb-5 text-sm duration-300 fade-in-0 motion-reduce:animate-none">
      {/* The cover, faded into the page (or the dialog) behind the entry's head */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-44 overflow-hidden bg-muted">
        {cover && (
          <img
            src={cover}
            alt=""
            onLoad={() => setCoverShown(true)}
            onError={() => setCoverFailed(true)}
            className={cn(
              "size-full object-cover object-[50%_25%] transition-opacity duration-500 motion-reduce:transition-none",
              coverShown ? "opacity-100" : "opacity-0",
            )}
          />
        )}
        <div
          className={cn(
            "absolute inset-0 bg-linear-to-b from-transparent",
            isDialog ? "via-popover/50 to-popover" : "via-background/50 to-background",
          )}
        />
      </div>

      <EntryHead
        entry={entry}
        genres={genres}
        onBack={onBack}
        loading={false}
        subscribers={subscribers}
        description={description}
      />

      <EntryAka
        altTitles={altTitles}
      />

      <EntryLinks
        entry={entry}
        isDialog={isDialog}
      />

      <EntryReactions
        reactions={reactions}
        entry={entry}
      />
    </div>
  );
}

export default EntryView;
