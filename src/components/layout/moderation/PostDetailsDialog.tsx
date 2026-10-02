import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { request } from "../../../core/messaging/client";
import { PostInputSchema } from "../../../core/schemas/moderation.schema";
import { describeError } from "./errors";



/**
 * @description
 * A post's details, as the form starts with them.
 */
export interface IPostDetails {
  id: string;
  title: string;
  description: string;
  creationDate: number;
  thumbnail: string;
}

/**
 * @description
 * Formats a date for a `datetime-local` input, in local time.
 *
 * @param time - The date, in epoch milliseconds
 * @returns The input's value
 */
export function toLocalInput(time: number): string {
  const date = new Date(time);

  return new Date(time - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/**
 * @description
 * Post details dialog props.
 */
export interface IPostDetailsDialogProps {
  open: boolean;
  post: IPostDetails;

  /**
   * @description
   * Whether the post is tracked already, so its details are edited.
   */
  tracked: boolean;

  /**
   * @description
   * Called when the dialog closes, with whether the post was saved.
   */
  onClose: (saved: boolean) => void;
}

/**
 * @description
 * Starts tracking a post, or edits a tracked post's details. Moderators only.
 *
 * @param props - The post, and what to do once closed
 * @returns The dialog
 */
function PostDetailsDialog(props: IPostDetailsDialogProps): JSX.Element {
  const { open, post, tracked, onClose } = props;
  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description);
  const [date, setDate] = useState(toLocalInput(post.creationDate));
  const [thumbnail, setThumbnail] = useState(post.thumbnail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(post.title);
      setDescription(post.description);
      setDate(toLocalInput(post.creationDate));
      setThumbnail(post.thumbnail);
      setError(null);
    }
  }, [open, post]);

  const save = async () => {
    const parsed = PostInputSchema.safeParse({ id: post.id, title, description, creationDate: new Date(date).getTime(), thumbnail: thumbnail.trim() });

    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];

      setError(field === "thumbnail" ? "The thumbnail must be an https link" : field === "creationDate" ? "Pick the date it was posted" : "Give the post a title");

      return;
    }

    setSaving(true);
    setError(null);

    try {
      await request("posts.save", { post: parsed.data });
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
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>{tracked ? "Edit post details" : "Track this post"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField size="small" label="Post ID" value={post.id} disabled />
          <TextField size="small" label="Title" required value={title} onChange={e => setTitle(e.target.value)} />
          <TextField size="small" label="Posted on" type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField multiline minRows={3} maxRows={8} size="small" label="Description" value={description} onChange={e => setDescription(e.target.value)} />
          <TextField size="small" label="Thumbnail link" placeholder="https://..." value={thumbnail} onChange={e => setThumbnail(e.target.value)} />

          {!tracked && <Alert severity="info">Once tracked, add its reactions from the panel under the post.</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button variant="contained" disableElevation disabled={saving} onClick={save}>{tracked ? "Save" : "Track post"}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PostDetailsDialog;
