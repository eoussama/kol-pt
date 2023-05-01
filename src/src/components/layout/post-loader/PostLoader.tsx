import styles from './PostLoader.module.scss';



/**
 * @description
 * The post's loader component, displayed
 * as a placeholder until the details are loaded.
 */
function PostLoader(): JSX.Element {
  return <>
    <div className={styles['loader']}>
      Loading post info...
    </div>
  </>
}

export default PostLoader;