import { CircleAlert } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { request } from "../../../core/messaging/client";
import { PostInputSchema } from "../../../core/schemas/moderation.schema";
import { Alert, AlertDescription } from "../../ui/alert";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "../../ui/field";
import { Input } from "../../ui/input";
import { Spinner } from "../../ui/spinner";
import { Textarea } from "../../ui/textarea";
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
 * The post fields a problem can be shown under.
 */
type TPostField = "title" | "creationDate" | "thumbnail";

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
  const formId = useId();
  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description);
  const [date, setDate] = useState(toLocalInput(post.creationDate));
  const [thumbnail, setThumbnail] = useState(post.thumbnail);
  const [saving, setSaving] = useState(false);
  // A problem with a field is shown under it, any other one under the form
  const [error, setError] = useState<{ message: string; field?: TPostField } | null>(null);
  const fieldError = (field: TPostField) => error?.field === field ? error.message : undefined;

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

      setError(field === "thumbnail"
        ? { field, message: "The thumbnail must be an https link" }
        : field === "creationDate"
          ? { field, message: "Pick the date it was posted" }
          : { field: "title", message: "Give the post a title" });

      return;
    }

    setSaving(true);
    setError(null);

    try {
      await request("posts.save", { post: parsed.data });
      onClose(true);
    }
    catch (failure) {
      setError({ message: describeError(failure) });
    }
    finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose(false)}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="p-4 pr-10 pb-3">
          <DialogTitle>{tracked ? "Edit post details" : "Track this post"}</DialogTitle>
          <DialogDescription>
            {tracked ? "How the post is listed in the extension." : "Once tracked, add its reactions from the panel under the post."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4">
          <FieldSet disabled={saving}>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
                <Field data-disabled>
                  <FieldLabel htmlFor={`${formId}-id`}>Post ID</FieldLabel>
                  <Input id={`${formId}-id`} value={post.id} disabled className="tabular-nums" />
                </Field>

                <Field data-invalid={Boolean(fieldError("creationDate"))}>
                  <FieldLabel htmlFor={`${formId}-date`}>
                    Posted on
                    <span aria-hidden className="-ml-1.5 text-muted-foreground">*</span>
                  </FieldLabel>
                  <Input
                    id={`${formId}-date`}
                    type="datetime-local"
                    required
                    value={date}
                    className="tabular-nums"
                    aria-invalid={Boolean(fieldError("creationDate"))}
                    onChange={e => setDate(e.target.value)}
                  />
                  <FieldError>{fieldError("creationDate")}</FieldError>
                </Field>
              </div>

              <Field data-invalid={Boolean(fieldError("title"))}>
                <FieldLabel htmlFor={`${formId}-title`}>
                  Title
                  <span aria-hidden className="-ml-1.5 text-muted-foreground">*</span>
                </FieldLabel>
                <Input id={`${formId}-title`} required value={title} aria-invalid={Boolean(fieldError("title"))} onChange={e => setTitle(e.target.value)} />
                <FieldError>{fieldError("title")}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor={`${formId}-description`}>Description</FieldLabel>
                <Textarea id={`${formId}-description`} value={description} className="max-h-48 min-h-20" onChange={e => setDescription(e.target.value)} />
              </Field>

              <Field data-invalid={Boolean(fieldError("thumbnail"))}>
                <FieldLabel htmlFor={`${formId}-thumbnail`}>Thumbnail link</FieldLabel>
                <Input
                  id={`${formId}-thumbnail`}
                  type="url"
                  placeholder="https://..."
                  value={thumbnail}
                  aria-invalid={Boolean(fieldError("thumbnail"))}
                  onChange={e => setThumbnail(e.target.value)}
                />
                <FieldError>{fieldError("thumbnail")}</FieldError>
              </Field>

              {error && !error.field && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}
            </FieldGroup>
          </FieldSet>
        </div>

        <DialogFooter className="m-0">
          <Button variant="outline" onClick={() => onClose(false)}>Cancel</Button>
          <Button disabled={saving} onClick={save}>
            {saving && <Spinner data-icon="inline-start" aria-hidden />}
            {tracked ? "Save" : "Track post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PostDetailsDialog;
