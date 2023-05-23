import { IEmptyProps } from '../../../../core/types/props/empty.props.type';
import styles from './Empty.module.scss';

import { useMemo } from 'react';



/**
 * @description
 * Handles switching between child component and
 * a placeholder empty component
 *
 * @param props The empty wrapper props
 */
function Empty(props: IEmptyProps) {
  const { message, children } = props;
  const childrenNum = useMemo(() => Array.from(children).length, [children]);
  const canShow = childrenNum > 0;

  return <>
    {
      canShow
        ? children
        : <div className={styles['empty']}>
          <img
            alt='Empty graph'
            src='./images/graphs/empty.svg'
            className={styles['empty__icon']}
          />

          <p className={styles['empty__message']}>{message}</p>
        </div>
    }
  </>
}

export default Empty;