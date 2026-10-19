import type { ISearchProps } from "../../../../core/types/props/search-props.type";

import { Search as SearchIcon } from "lucide-react";
import { Badge } from "../../../ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../../ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";



/**
 * @description
 * Light component that handles searching. It stays above the list it
 * searches as it scrolls, cards' chips included.
 *
 * @param props - The search component props
 * @returns The rendered search input
 */
function Search(props: ISearchProps): JSX.Element {
  const { placeholder, actions, count, countLabel, onSearch } = props;

  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur-sm">
      <InputGroup className="flex-1 bg-muted/40">
        <InputGroupInput
          type="search"
          className="text-sm"
          onChange={onSearch}
          aria-label={placeholder ?? "Search"}
          placeholder={placeholder ?? "Search..."}
        />

        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>

        {count !== undefined && (
          <InputGroupAddon align="inline-end">
            <Tooltip>
              <TooltipTrigger render={<Badge variant="secondary" className="min-w-6 cursor-default tabular-nums" />}>
                {count}
              </TooltipTrigger>
              {countLabel && <TooltipContent>{countLabel}</TooltipContent>}
            </Tooltip>
          </InputGroupAddon>
        )}
      </InputGroup>

      {actions && (
        <div className="flex shrink-0 items-center gap-1.5">
          {actions}
        </div>
      )}
    </div>
  );
}

export default Search;
