import type { IPostErrorProps } from "../../../../core/types/props/post-error.type";

import WarningIcon from "@mui/icons-material/Warning";
import { Fragment } from "react";
import styles from "./Error.module.scss";



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
    <>
      <div className={styles.error}>
        <WarningIcon className={styles.error__icon} />
        <span className={styles.error__message}>{message}</span>
      </div>
    </>
  );
}

export default Error;
