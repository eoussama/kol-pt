import type { Tag } from "../core/models/tag.model";
import type { IReactionOverlayContext } from "../core/types/context/reaction-overlay-context.type";
import type { Nullable } from "../core/types/nullable.type";
import type { IReactionOverlayProviderProps } from "../core/types/providers/reaction-overlay-provider.props";
import { createContext, useEffect, useState } from "react";



/**
 * @description
 * Context for Reaction overlays (Menu, Dialog)
 */
export const ReactionOverlayContext = createContext<IReactionOverlayContext>({} as IReactionOverlayContext);

/**
 * @description
 * Provides context for the Reaction overlays (Menu, Dialog)
 *
 * @param props - The props passed down to the provider
 * @returns The reaction overlay context provider wrapping its children
 */
export function ReactionOverlayProvider(props: IReactionOverlayProviderProps): JSX.Element {
  const [tag, setTag] = useState<Nullable<Tag>>(null);
  const [anchorEl, setAnchorEl] = useState<Nullable<HTMLElement>>(null);
  const [anchorOpened, setAnchorOpened] = useState(Boolean(anchorEl));
  const [dialogOpened, setDialogOpened] = useState<boolean>(false);

  const value = { anchorEl, setAnchorEl, anchorOpened, setAnchorOpened, tag, setTag, dialogOpened, setDialogOpened };

  useEffect(() => {
    if (!anchorOpened) {
      setAnchorEl(null);
    }
  }, [anchorOpened]);

  return (
    <ReactionOverlayContext.Provider value={value}>
      {props.children}
    </ReactionOverlayContext.Provider>
  );
}
