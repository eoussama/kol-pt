import styles from './Loader.module.scss';

import { ILoaderProps } from '../../../core/types/props/loader-props.type';



/**
 * @description
 * Renders skeleton loader element
 */
function Loader(props: ILoaderProps): JSX.Element {
  const { width, height } = props;

  const flatClass = props.flat ? styles['loader--flat'] : '';
  const overlayClass = props.overlay ? styles['loader--overlay'] : '';
  const classes = `${styles['loader']} ${flatClass} ${overlayClass}`

  return (
    <div
      className={classes}
      style={{ width: width ?? '100%', height: height ?? '100%' }}
    >
    </div>
  );
}

export default Loader;