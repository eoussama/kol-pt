import type { ReactNode } from "react";

import { createContext, useContext } from "react";



/**
 * @description
 * Where overlays (dialogs, menus, tooltips, popovers, selects) render. The
 * popup leaves it unset, so they go to the body. On Patreon it is an element
 * in a shadow root that holds the panels' styles.
 */
const PortalContainerContext = createContext<HTMLElement | null>(null);

/**
 * @description
 * Sets where the overlays inside render.
 *
 * @param props - The container, and what renders overlays into it
 * @param props.container - The element overlays render into, null for the body
 * @param props.children - The tree
 * @returns The provider
 */
export function PortalContainerProvider(props: { container: HTMLElement | null; children: ReactNode }): JSX.Element {
  return (
    <PortalContainerContext.Provider value={props.container}>
      {props.children}
    </PortalContainerContext.Provider>
  );
}

/**
 * @description
 * Where overlays render, for the shadcn/ui components' portals.
 *
 * @returns The container, or undefined for the body
 */
export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext) ?? undefined;
}
