import type { TUnsafe } from "@eoussama/core";
import type { Tag } from "../core/domain/tag";
import type { IReactionOverlayContext } from "../core/types/context/reaction-overlay-context.type";
import type { IReactionOverlayProviderProps } from "../core/types/providers/reaction-overlay-provider.props";

import { createContext, useState } from "react";



/**
 * @description
 * Context for the reaction details dialog
 */
export const ReactionOverlayContext = createContext<IReactionOverlayContext>({} as IReactionOverlayContext);

/**
 * @description
 * Provides context for the reaction details dialog
 *
 * @param props - The props passed down to the provider
 * @returns The reaction overlay context provider wrapping its children
 */
export function ReactionOverlayProvider(props: IReactionOverlayProviderProps): JSX.Element {
  const [tag, setTag] = useState<TUnsafe<Tag>>(null);
  const [dialogOpened, setDialogOpened] = useState<boolean>(false);

  const value = { tag, setTag, dialogOpened, setDialogOpened };

  return (
    <ReactionOverlayContext.Provider value={value}>
      {props.children}
    </ReactionOverlayContext.Provider>
  );
}
