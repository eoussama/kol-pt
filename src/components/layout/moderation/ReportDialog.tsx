import type { Tag } from "../../../core/domain/tag";
import type { TReportKind } from "../../../core/schemas/moderation.schema";

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useEffect, useState } from "react";
import { request } from "../../../core/messaging/client";
import { describeError } from "./errors";
import TimeField from "./TimeField";



/**
 * @description
 * What a report form asks for, by kind.
 */
const KINDS: Record<TReportKind, { title: string; note: string; notePlaceholder: string; noteRequired: boolean; times: boolean }> = {
  timestamp: {
    title: "Wrong timestamp",
    note: "Note",
    notePlaceholder: "Anything else a moderator should know",
    noteRequired: false,
    times: true,
  },
  entry: {
    title: "Wrong show or episode",
    note: "What is it really?",
    notePlaceholder: "e.g. It's episode 5, not 4",
    noteRequired: true,
    times: false,
  },
  missing: {
    title: "Missing reaction",
    note: "What did KOL react to?",
    notePlaceholder: "e.g. One Piece episode 1100",
    noteRequired: true,
    times: true,
  },
  untracked: {
    title: "Track this post",
    note: "Note",
    notePlaceholder: "e.g. What KOL reacts to in it",
    noteRequired: false,
    times: false,
  },
};

/**
 * @description
 * Report dialog props.
 */
export interface IReportDialogProps {
  open: boolean;
  onClose: () => void;

  /**
   * @description
   * What is reported. For a reaction, the viewer picks between `timestamp`
   * and `entry`, starting with this one.
   */
  kind: TReportKind;
  post: { id: string; title: string };

  /**
   * @description
   * The reaction reported, for `timestamp` and `entry` reports.
   */
  tag?: Tag | null;
}

/**
 * @description
 * Lets a signed-in viewer report a problem with a reaction or a post to the
 * moderators, with suggested times where they help.
 *
 * @param props - What is reported
 * @returns The dialog
 */
function ReportDialog(props: IReportDialogProps): JSX.Element {
  const { open, onClose, post, tag } = props;
  const [kind, setKind] = useState<TReportKind>(props.kind);
  const [note, setNote] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const form = KINDS[kind];
  const timesInvalid = startTime !== null && endTime !== null && endTime <= startTime;
  const canSend = !sending && !timesInvalid && (!form.noteRequired || note.trim().length > 0);

  useEffect(() => {
    if (open) {
      setKind(props.kind);
      setNote("");
      setStartTime(tag ? tag.startTime : null);
      setEndTime(tag ? tag.endTime : null);
      setError(null);
      setSent(false);
    }
  }, [open, props.kind, tag]);

  const send = async () => {
    setSending(true);
    setError(null);

    try {
      await request("reports.create", {
        report: {
          kind,
          postId: post.id,
          postTitle: post.title.slice(0, 300),
          tagId: tag && (kind === "timestamp" || kind === "entry") ? tag.id : undefined,
          tagTitle: tag ? `${tag.getTitle()} — ${tag.getDetailDescription()}`.slice(0, 300) : undefined,
          note: note.trim(),
          startTime: form.times && startTime !== null ? startTime : undefined,
          endTime: form.times && endTime !== null ? endTime : undefined,
        },
      });
      setSent(true);
    }
    catch (failure) {
      setError(describeError(failure));
    }
    finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{tag ? "Report a problem" : form.title}</DialogTitle>

      <DialogContent>
        {sent
          ? <Alert severity="success">Thanks! A moderator will look at it.</Alert>
          : (
              <Stack spacing={2} sx={{ pt: 1 }}>
                {tag && (
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={kind}
                    onChange={(_, value: TReportKind | null) => value && setKind(value)}
                  >
                    <ToggleButton value="timestamp">{KINDS.timestamp.title}</ToggleButton>
                    <ToggleButton value="entry">{KINDS.entry.title}</ToggleButton>
                  </ToggleButtonGroup>
                )}

                {form.times && (
                  <Stack direction="row" spacing={1}>
                    <TimeField label="Starts at" value={startTime} onChange={setStartTime} />
                    <TimeField label="Ends at" value={endTime} onChange={setEndTime} error={timesInvalid ? "Must be after the start" : undefined} />
                  </Stack>
                )}

                <TextField
                  multiline
                  minRows={2}
                  size="small"
                  label={form.note}
                  value={note}
                  required={form.noteRequired}
                  placeholder={form.notePlaceholder}
                  onChange={e => setNote(e.target.value.slice(0, 500))}
                  helperText={`${note.length}/500`}
                />

                {error && <Alert severity="error">{error}</Alert>}
              </Stack>
            )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{sent ? "Close" : "Cancel"}</Button>
        {!sent && <Button variant="contained" disableElevation disabled={!canSend} onClick={send}>Send report</Button>}
      </DialogActions>
    </Dialog>
  );
}

export default ReportDialog;
