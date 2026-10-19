import { LocateFixed } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { usePlayer } from "../../../content/player/PlayerProvider";
import { formatTimestamp, parseTimestamp } from "../../../core/utils/time";
import { Field, FieldError, FieldLabel } from "../../ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../../ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";



/**
 * @description
 * Time field props.
 */
interface ITimeFieldProps {
  label: string;

  /**
   * @description
   * The time in seconds, null when empty or unreadable.
   */
  value: number | null;
  onChange: (seconds: number | null) => void;
  required?: boolean;

  /**
   * @description
   * A problem to show under the field.
   */
  error?: string;
}

/**
 * @description
 * A video position typed as `h:mm:ss`, or taken from the post's video with
 * one click.
 *
 * @param props - The field's label, value and change handler
 * @returns The field
 */
function TimeField(props: ITimeFieldProps): JSX.Element {
  const { label, value, onChange, required, error } = props;
  const id = useId();
  const { ready, currentTime } = usePlayer();
  const [text, setText] = useState(value === null ? "" : formatTimestamp(value));
  const unreadable = text.trim() !== "" && parseTimestamp(text) === null;
  const problem = unreadable ? "Use h:mm:ss" : error;

  // Follows values set from outside, e.g. a report's suggested time
  useEffect(() => {
    setText(current => parseTimestamp(current) === value ? current : (value === null ? "" : formatTimestamp(value)));
  }, [value]);

  const set = (next: string) => {
    setText(next);
    onChange(parseTimestamp(next));
  };

  return (
    <Field data-invalid={Boolean(problem)}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <span aria-hidden className="-ml-1.5 text-muted-foreground">*</span>}
      </FieldLabel>

      <InputGroup>
        <InputGroupInput
          id={id}
          value={text}
          required={required}
          placeholder="0:00:00"
          autoComplete="off"
          aria-invalid={Boolean(problem)}
          className="tabular-nums"
          onChange={e => set(e.target.value)}
        />

        <InputGroupAddon align="inline-end">
          <Tooltip>
            {/* The wrapper keeps the tooltip working while the button is disabled */}
            <TooltipTrigger render={<span className="-mr-[0.3rem] inline-flex" />}>
              <InputGroupButton
                size="icon-xs"
                disabled={!ready}
                aria-label={`Set ${label.toLowerCase()} from the video`}
                onClick={() => set(formatTimestamp(currentTime))}
              >
                <LocateFixed />
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent>{ready ? "Use the video's current time" : "The video is not ready"}</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>

      <FieldError>{problem}</FieldError>
    </Field>
  );
}

export default TimeField;
