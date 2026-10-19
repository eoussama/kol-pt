import type { IEntryPageHeadSectionProps } from "../../../../core/types/props/entry-head.props.type";

import { ArrowLeft } from "lucide-react";
import { millify } from "millify";
import { EEntryType } from "../../../../core/enums/entry-type.enum";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Skeleton } from "../../../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import Loader from "../../generic/loader/Loader";
import TextExpand from "../../generic/text-expand/TextExpand";



/**
 * @description
 * The entry head component. It leaves room at the top for the cover, which
 * the entry view draws behind it.
 *
 * @param props - Component props
 * @returns The rendered entry head section
 */
function EntryHead(props: IEntryPageHeadSectionProps): JSX.Element {
  const { entry, loading, subscribers, description, genres, onBack } = props;

  return (
    <section className="relative flex flex-col">
      {onBack
        && (
          <Tooltip>
            <TooltipTrigger
              render={(
                <Button
                  size="icon-sm"
                  variant="secondary"
                  onClick={onBack}
                  aria-label="Back to entries"
                  className="absolute top-3 left-3 z-10 rounded-full bg-background/80 shadow-sm backdrop-blur-sm hover:bg-background"
                />
              )}
            >
              <ArrowLeft />
            </TooltipTrigger>
            <TooltipContent side="right">Back to entries</TooltipContent>
          </Tooltip>
        )}

      <div className="relative h-28">
        {loading ? <Loader flat={true} overlay={true} /> : ""}
      </div>

      <div className="flex flex-col gap-1.5 px-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">{entry.getTypeName()}</Badge>
          {entry.type === EEntryType.YOUTUBE
            && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {millify(subscribers)}
                {" "}
                subscribers
              </span>
            )}
        </div>

        <h2 className="line-clamp-3 text-lg leading-tight font-semibold tracking-tight">{entry.title}</h2>
      </div>

      <div className="px-4 pt-2 text-sm leading-relaxed text-muted-foreground">
        {loading
          ? (
              <div className="flex flex-col gap-1.5 py-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            )
          : <TextExpand content={description} />}
      </div>

      {genres.length > 0
        && (
          <ul aria-label="Genres" className="flex flex-wrap gap-1 px-4 pt-3">
            {genres.map((e, i) => (
              <li key={i}>
                <Badge variant="outline" className="text-muted-foreground">{e}</Badge>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}

export default EntryHead;
