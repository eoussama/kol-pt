import styles from './PostError.module.scss';

import { Fragment } from 'react';
import WarningIcon from '@mui/icons-material/Warning';
import { IPostErrorProps } from '../../../core/types/props/post-error.type';



/**
 * @description
 * The post error component, displays error messages
 *
 * @param props The error props
 */
function PostError(props: IPostErrorProps): JSX.Element {
  const { error, message, children } = props;

  if (!error) {
    return children ?? <Fragment />;
  }

  return <>
    <div className={styles['error']}>
      <WarningIcon className={styles['error__icon']} />
      <span className={styles['error__message']}>{message}</span>
    </div>
  </>
}

export default PostError;