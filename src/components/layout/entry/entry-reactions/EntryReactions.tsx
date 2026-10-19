import type { IReaction } from "../../../../core/domain/hydrate";
import type { IEntryPageReactionsSectionProps } from "../../../../core/types/props/entry-reactions.props.type";

import { Play, Search } from "lucide-react";
import { openPost } from "../../../../core/utils/links";
import { useSearch } from "../../../../hooks/search.hook";
import { Button } from "../../../ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../../ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";



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
    <section className="flex flex-col gap-2 px-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        Reactions
        <span className="text-xs font-normal text-muted-foreground tabular-nums">{reactions.length}</span>
      </h3>

      {reactions.length > 1 && (
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>

          <InputGroupInput
            type="search"
            className="text-sm"
            onChange={onSearch}
            placeholder="Search reactions..."
            aria-label="Search reactions"
          />
        </InputGroup>
      )}

      {filtered.length === 0 && search.trim() && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No reactions match
          {" "}
          <b className="font-medium text-foreground">{search.trim()}</b>
        </p>
      )}

      {filtered.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {filtered.map((reaction, i) => (
            <li
              key={i}
              className="group flex items-center gap-2 py-2 pr-2 pl-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">
                  {reaction.tag.getDetailDescription()}
                </span>

                <span className="text-xs text-muted-foreground tabular-nums">
                  {reaction.date.toLocaleDateString()}
                </span>
              </div>

              <Tooltip>
                <TooltipTrigger
                  render={(
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="restart reaction"
                      onClick={() => onWatch(reaction)}
                      className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-foreground motion-reduce:transition-none"
                    />
                  )}
                >
                  <Play />
                </TooltipTrigger>
                <TooltipContent side="left">Watch reaction</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default EntryReactions;
