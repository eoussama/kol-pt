import type { IEmptyProps } from "../../../../core/types/props/empty.props.type";

import { Inbox } from "lucide-react";
import { useMemo } from "react";
import { EmptyDescription, EmptyHeader, EmptyMedia, Empty as EmptyState } from "../../../ui/empty";



/**
 * @description
 * Handles switching between child component and
 * a placeholder empty component
 *
 * @param props - The empty wrapper props
 * @returns The rendered children or empty placeholder
 */
function Empty(props: IEmptyProps) {
  const { message, children } = props;
  const childrenNum = useMemo(() => Array.from(children).length, [children]);
  const canShow = childrenNum > 0;

  return (
    <>
      {
        canShow
          ? children
          : (
              <EmptyState className="py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-10 rounded-xl text-muted-foreground">
                    <Inbox className="size-5" />
                  </EmptyMedia>

                  <EmptyDescription className="text-sm [&_b]:font-medium [&_b]:text-foreground">
                    {message}
                  </EmptyDescription>
                </EmptyHeader>
              </EmptyState>
            )
      }
    </>
  );
}

export default Empty;
