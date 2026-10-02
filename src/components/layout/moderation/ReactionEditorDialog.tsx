import type { Entry } from "../../../core/domain/entry";
import type { Tag } from "../../../core/domain/tag";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { Alert, Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Tooltip } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { readYouTubeContext } from "../../../core/domain/context";
import { EEntryType, hasEpisodes } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import { TagInputSchema } from "../../../core/schemas/moderation.schema";
import { useEntriesStore } from "../../../state/entries.state";
import EntryEditorDialog from "./EntryEditorDialog";
import { describeError } from "./errors";
import TimeField from "./TimeField";



/**
 * @description
 * Reads a YouTube video id from an id or any YouTube link.
 *
 * @param text - The id or link
 * @returns The video id, or the text if it is not a link
 */
export function toYouTubeVideoId(text: string): string {
  const value = text.trim();

  try {
    const url = new URL(value);

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1);
    }

    return url.searchParams.get("v") ?? /\/(?:shorts|embed|live)\/([\w-]+)/.exec(url.pathname)?.[1] ?? value;
  }
  catch {
    return value;
  }
}

/**
 * @description
 * Reaction editor props.
 */
export interface IReactionEditorDialogProps {
  open: boolean;
  postId: string;

  /**
   * @description
   * The reaction to edit, or null to add one.
   */
  tag: Tag | null;

  /**
   * @description
   * Times to start with instead of the reaction's, e.g. from a report.
   */
  initial?: { startTime?: number; endTime?: number };

  /**
   * @description
   * Called when the dialog closes, with whether the reaction was saved.
   */
  onClose: (saved: boolean) => void;
}

/**
 * @description
 * Adds a reaction to a post or edits one: what KOL reacted to, and when.
 * Moderators only.
 *
 * @param props - The post, the reaction, and what to do once closed
 * @returns The dialog
 */
function ReactionEditorDialog(props: IReactionEditorDialogProps): JSX.Element {
  const { open, postId, tag, initial, onClose } = props;
  const entries = useEntriesStore(e => e.entries);
  const loadEntries = useEntriesStore(e => e.loadEntries);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoId, setVideoId] = useState("");
  const [entryEditor, setEntryEditor] = useState<{ entry: Entry | null; title: string } | null>(null);
  const [typed, setTyped] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entry = useMemo(() => entries.find(candidate => candidate.id === entryId) ?? null, [entries, entryId]);
  const isYouTube = entry?.type === EEntryType.YOUTUBE;
  const timesInvalid = startTime !== null && endTime !== null && endTime <= startTime;

  useEffect(() => {
    if (!open) {
      return;
    }

    const context = readYouTubeContext(tag?.context ?? {});

    loadEntries();
    setEntryId(tag?.entryId ?? null);
    setLabel(tag?.label ?? "");
    setDescription(tag?.description ?? "");
    setStartTime(initial?.startTime ?? tag?.startTime ?? null);
    setEndTime(initial?.endTime ?? tag?.endTime ?? null);
    setVideoTitle(context.title ?? "");
    setVideoId(context.videoId ?? "");
    setError(null);
  }, [open, tag, initial, loadEntries]);

  const save = async () => {
    const parsed = TagInputSchema.safeParse({
      id: tag?.id ?? crypto.randomUUID(),
      entryId: entryId ?? "",
      label,
      description,
      startTime: startTime ?? Number.NaN,
      endTime: endTime ?? Number.NaN,
      context: isYouTube
        ? { title: videoTitle.trim() || undefined, videoId: toYouTubeVideoId(videoId) || undefined, altTitles: readYouTubeContext(tag?.context ?? {}).altTitles }
        : {},
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];

      setError(issue?.path[0] === "entryId" ? "Pick what KOL reacted to" : issue?.message ?? "Check the fields");

      return;
    }

    setSaving(true);
    setError(null);

    try {
      await request("tags.save", { postId, tag: parsed.data });
      onClose(true);
    }
    catch (failure) {
      setError(describeError(failure));
    }
    finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open && entryEditor === null} onClose={() => onClose(false)} fullWidth maxWidth="sm">
        <DialogTitle>{tag ? "Edit reaction" : "Add a reaction"}</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
              <Autocomplete
                fullWidth
                size="small"
                options={entries}
                value={entry}
                inputValue={typed}
                onInputChange={(_, value) => setTyped(value)}
                onChange={(_, value) => setEntryId(value?.id ?? null)}
                getOptionLabel={option => `${option.title} · ${option.getTypeName()}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                filterOptions={(options, { inputValue }) => options.filter(option => option.match(inputValue.toLowerCase()))}
                noOptionsText="No entry matches. Create one with +"
                renderInput={params => <TextField {...params} required label="What KOL reacted to" />}
              />

              {entry && (
                <Tooltip title="Edit this entry">
                  <IconButton aria-label="edit entry" onClick={() => setEntryEditor({ entry, title: "" })}><EditIcon /></IconButton>
                </Tooltip>
              )}

              <Tooltip title="New entry">
                <IconButton aria-label="new entry" onClick={() => setEntryEditor({ entry: null, title: entry ? "" : typed })}><AddIcon /></IconButton>
              </Tooltip>
            </Stack>

            <TextField
              size="small"
              required
              label={hasEpisodes(entry?.type) ? "Episode" : "Label"}
              placeholder={hasEpisodes(entry?.type) ? "e.g. 12" : "e.g. the video's name"}
              value={label}
              onChange={e => setLabel(e.target.value)}
            />

            {isYouTube && (
              <Stack direction="row" spacing={1}>
                <TextField fullWidth size="small" label="Video title" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} />
                <TextField fullWidth size="small" label="Video ID or link" value={videoId} onChange={e => setVideoId(e.target.value)} />
              </Stack>
            )}

            <Stack direction="row" spacing={1}>
              <TimeField label="Starts at" required value={startTime} onChange={setStartTime} />
              <TimeField label="Ends at" required value={endTime} onChange={setEndTime} error={timesInvalid ? "Must be after the start" : undefined} />
            </Stack>

            <TextField multiline minRows={2} size="small" label="Description" value={description} onChange={e => setDescription(e.target.value)} />

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onClose(false)}>Cancel</Button>
          <Button variant="contained" disableElevation disabled={saving || timesInvalid} onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      <EntryEditorDialog
        open={entryEditor !== null}
        entry={entryEditor?.entry ?? null}
        initialTitle={entryEditor?.title}
        onClose={(savedId) => {
          if (savedId) {
            setEntryId(savedId);
          }
          setEntryEditor(null);
        }}
      />
    </>
  );
}

export default ReactionEditorDialog;
