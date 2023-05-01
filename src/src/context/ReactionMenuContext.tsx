import { Tag } from "../core/models/tag.model";
import { Nullable } from "../core/types/nullable.type";
import { createContext, useEffect, useState } from "react";
import { IReactionMenuContext } from "../core/types/context/reaction-menu-context.type";
import { IReactionMenuProviderProps } from "../core/types/providers/reaction-menu-provider.props";



/**
 * @description
 * Context for Reaction Menu
 */
export const ReactionMenuContext = createContext<IReactionMenuContext>({} as any);

/**
 * @description
 * Provides context for the Reaction Menu
 *
 * @param props The propts passed down to the provider
 */
export function ReactionMenuProvider(props: IReactionMenuProviderProps): JSX.Element {
  const [tag, setTag] = useState<Nullable<Tag>>(null);
  const [anchorEl, setAnchorEl] = useState<Nullable<HTMLElement>>(null);
  const [anchorOpened, setAnchorOpened] = useState(Boolean(anchorEl));

  const value = { anchorEl, setAnchorEl, anchorOpened, setAnchorOpened, tag, setTag };

  useEffect(() => {
    if (!anchorOpened) {
      setAnchorEl(null);
    }
  }, [anchorOpened]);

  return (
    <ReactionMenuContext.Provider value={value}>
      {props.children}
    </ReactionMenuContext.Provider>
  );
}