import styles from './TextExpand.module.scss';

import { useEffect, useState } from 'react';
import { ITextExpandProps } from '../../../../core/types/props/text-expand-props.type';



/**
 * @description
 * Renders togglable text paragraphs.
 */
function TextExpand(props: ITextExpandProps): JSX.Element {
  const { content } = props;
  const minLength = props.minLength ?? 200;

  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);

  /**
   * @description
   * Toggles more/less description content
   */
  const onMoreToggle = () => {
    setExpanded(!expanded)
  }

  useEffect(() => {
    const newText = (expanded || content.length <= minLength)
      ? content
      : `${content.slice(0, minLength)}...`;

    setText(newText);
  }, [expanded, content, minLength]);

  return (
    <>
      {text}
      {content.length > minLength &&
        <span
          onClick={onMoreToggle}
          className={styles['more']}
        >read {expanded ? 'less' : 'more'}</span>
      }
    </>
  );
}

export default TextExpand;