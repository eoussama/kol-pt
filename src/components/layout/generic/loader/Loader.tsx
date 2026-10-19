import type { ILoaderProps } from "../../../../core/types/props/loader-props.type";

import { cn } from "../../../../core/utils/cn";
import { Skeleton } from "../../../ui/skeleton";



/**
 * @description
 * Renders skeleton loader element
 *
 * @param props - The loader props
 * @returns The rendered skeleton loader
 */
function Loader(props: ILoaderProps): JSX.Element {
  const { width, height } = props;

  return (
    <Skeleton
      className={cn("rounded-lg", props.flat && "rounded-none", props.overlay && "absolute inset-0")}
      style={{ width: width ?? "100%", height: height ?? "100%" }}
    />
  );
}

export default Loader;
