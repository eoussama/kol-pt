import MyLocationIcon from "@mui/icons-material/MyLocation";
import { IconButton, InputAdornment, TextField, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { usePlayer } from "../../../content/player/PlayerProvider";
import { formatTimestamp, parseTimestamp } from "../../../core/utils/time";



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
  const { ready, currentTime } = usePlayer();
  const [text, setText] = useState(value === null ? "" : formatTimestamp(value));
  const unreadable = text.trim() !== "" && parseTimestamp(text) === null;

  // Follows values set from outside, e.g. a report's suggested time
  useEffect(() => {
    setText(current => parseTimestamp(current) === value ? current : (value === null ? "" : formatTimestamp(value)));
  }, [value]);

  const set = (next: string) => {
    setText(next);
    onChange(parseTimestamp(next));
  };

  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={text}
      required={required}
      placeholder="0:00:00"
      error={unreadable || Boolean(error)}
      helperText={unreadable ? "Use h:mm:ss" : error}
      onChange={e => set(e.target.value)}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={ready ? "Use the video's current time" : "The video is not ready"}>
                <span>
                  <IconButton
                    size="small"
                    edge="end"
                    disabled={!ready}
                    aria-label={`Set ${label.toLowerCase()} from the video`}
                    onClick={() => set(formatTimestamp(currentTime))}
                  >
                    <MyLocationIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export default TimeField;
