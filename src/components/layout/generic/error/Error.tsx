import type { IPostErrorProps } from "../../../../core/types/props/post-error.type";

import { TriangleAlert } from "lucide-react";
import { Fragment } from "react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "../../../ui/empty";



/**
 * @description
 * The post error component, displays error messages
 *
 * @param props - The error props
 * @returns The rendered error state or children
 */
function Error(props: IPostErrorProps): JSX.Element {
  const { error, message, children } = props;

  if (!error) {
    return children ?? <Fragment />;
  }

  return (
    <Empty role="alert" className="py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-10 rounded-xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-5" />
        </EmptyMedia>

        <EmptyTitle className="text-muted-foreground">{message}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export default Error;
