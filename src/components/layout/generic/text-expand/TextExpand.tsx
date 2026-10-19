import type { ITextExpandProps } from "../../../../core/types/props/text-expand-props.type";

import { useEffect, useState } from "react";



/**
 * @description
 * Renders togglable text paragraphs.
 *
 * @param props - The text expand props
 * @returns The rendered expandable text
 */
function TextExpand(props: ITextExpandProps): JSX.Element {
  const { content } = props;
  const minLength = props.minLength ?? 200;

  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  /**
   * @description
   * Toggles more/less description content
   */
  const onMoreToggle = () => {
    setExpanded(!expanded);
  };

  useEffect(() => {
    const newText = (expanded || content.length <= minLength)
      ? content
      : `${content.slice(0, minLength)}...`;

    setText(newText);
  }, [expanded, content, minLength]);

  return (
    <>
      {text}
      {content.length > minLength
        && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={onMoreToggle}
            className="ml-1 rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {expanded ? "read less" : "read more"}
          </button>
        )}
    </>
  );
}

export default TextExpand;
