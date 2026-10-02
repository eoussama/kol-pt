import type { ErrorInfo, ReactNode } from "react";

import { Component } from "react";



/**
 * @description
 * Error boundary props.
 */
interface IErrorBoundaryProps {

  /**
   * @description
   * What to render instead of the children after they throw.
   */
  fallback?: ReactNode;

  /**
   * @description
   * The guarded subtree.
   */
  children: ReactNode;
}

/**
 * @description
 * Error boundary state.
 */
interface IErrorBoundaryState {
  failed: boolean;
}

/**
 * @description
 * Renders a fallback instead of a subtree that threw while rendering, so one
 * broken panel does not take the others down with it.
 */
export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  override state: IErrorBoundaryState = { failed: false };

  /**
   * @description
   * Switches to the fallback after a render error.
   *
   * @returns The new state
   */
  static getDerivedStateFromError(): IErrorBoundaryState {
    return { failed: true };
  }

  /**
   * @description
   * Reports the error.
   *
   * @param error - The error thrown
   * @param info - Where it was thrown
   */
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[KOL PT]", error, info.componentStack);
  }

  /**
   * @description
   * Renders the children, or the fallback after they threw.
   *
   * @returns The rendered subtree
   */
  override render(): ReactNode {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
