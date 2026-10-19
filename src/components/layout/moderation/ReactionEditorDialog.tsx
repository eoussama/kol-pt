import type { Entry } from "../../../core/domain/entry";
import type { Tag } from "../../../core/domain/tag";

import { CircleAlert, Pencil, Plus } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { readYouTubeContext } from "../../../core/domain/context";
import { describeReaction } from "../../../core/domain/tag";
import { EEntryType, hasEpisodes } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import { TagInputSchema } from "../../../core/schemas/moderation.schema";
import { useEntriesStore } from "../../../state/entries.state";
import { Alert, AlertDescription } from "../../ui/alert";
import { Button } from "../../ui/button";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "../../ui/combobox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from "../../ui/field";
import { Input } from "../../ui/input";
import { Spinner } from "../../ui/spinner";
import { Textarea } from "../../ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import EntryEditorDialog, { toEntryInput, toForm } from "./EntryEditorDialog";
import { describeError } from "./errors";
import TimeField from "./TimeField";



/**
 * @description
 * The reaction fields a problem can be shown under.
 */
type TTagField = "entryId" | "label" | "description" | "startTime" | "endTime" | "context" | "altTitles";

/**
 * @description
 * Reads titles typed one per line.
 *
 * @param text - The typed titles
 * @returns The titles, trimmed, without blank lines
 */
function toTitles(text: string): Array<string> {
  return text.split("\n").map(title => title.trim()).filter(Boolean);
}

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
 * Names an entry in the picker.
 *
 * @param entry - The entry
 * @returns e.g. `Frieren · Anime`
 */
function toEntryLabel(entry: Entry): string {
  return `${entry.title} · ${entry.getTypeName()}`;
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
  const formId = useId();
  const entries = useEntriesStore(e => e.entries);
  const loadEntries = useEntriesStore(e => e.loadEntries);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  // Null follows the entry and episode picked, until typed over
  const [description, setDescription] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoId, setVideoId] = useState("");
  // A YouTube video's own titles, or else the entry's, one per line
  const [altTitles, setAltTitles] = useState("");
  const [entryEditor, setEntryEditor] = useState<{ entry: Entry | null; title: string } | null>(null);
  const [typed, setTyped] = useState("");
  const [saving, setSaving] = useState(false);
  // A problem with a field is shown under it, any other one under the form
  const [error, setError] = useState<{ message: string; field?: TTagField } | null>(null);
  const entry = useMemo(() => entries.find(candidate => candidate.id === entryId) ?? null, [entries, entryId]);
  const isYouTube = entry?.type === EEntryType.YOUTUBE;
  const timesInvalid = startTime !== null && endTime !== null && endTime <= startTime;
  const hoverText = description ?? (entry ? describeReaction(entry, label.trim()) : "");
  const fieldError = (field: TTagField) => error?.field === field ? error.message : undefined;

  useEffect(() => {
    if (!open) {
      return;
    }

    const context = readYouTubeContext(tag?.context ?? {});

    loadEntries();
    setEntryId(tag?.entryId ?? null);
    setLabel(tag?.label ?? "");
    setDescription(tag ? tag.description : null);
    setStartTime(initial?.startTime ?? tag?.startTime ?? null);
    setEndTime(initial?.endTime ?? tag?.endTime ?? null);
    setVideoTitle(context.title ?? "");
    setVideoId(context.videoId ?? "");
    setError(null);
  }, [open, tag, initial, loadEntries]);

  // Follows the entry picked, and the entry once it is saved
  useEffect(() => {
    if (!open) {
      return;
    }

    const videoTitles = entry?.id === tag?.entryId ? readYouTubeContext(tag?.context ?? {}).altTitles ?? [] : [];

    setAltTitles((isYouTube ? videoTitles : entry?.altTitles ?? []).join("\n"));
  }, [open, tag, entry, isYouTube]);

  const save = async () => {
    const parsed = TagInputSchema.safeParse({
      id: tag?.id ?? crypto.randomUUID(),
      entryId: entryId ?? "",
      label,
      description: hoverText,
      startTime: startTime ?? Number.NaN,
      endTime: endTime ?? Number.NaN,
      context: isYouTube
        ? { title: videoTitle.trim() || undefined, videoId: toYouTubeVideoId(videoId) || undefined, altTitles: toTitles(altTitles).length > 0 ? toTitles(altTitles) : undefined }
        : {},
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path[0];

      /* v8 ignore next -- a failed parse always has an issue, the fallback only satisfies the types */
      const fallback = issue?.message ?? "Check the fields";

      setError({
        message: field === "entryId" ? "Pick what KOL reacted to" : fallback,
        field: field === "entryId" || field === "label" || field === "description" || field === "startTime" || field === "endTime" || (field === "context" && isYouTube) ? field : undefined,
      });

      return;
    }

    // Other entries' titles belong to the entry, saved with the reaction
    const entryTitles = toTitles(altTitles);
    const entryChanged = entry !== null && !isYouTube && entryTitles.join("\n") !== entry.altTitles.join("\n");
    const entryInput = entryChanged ? toEntryInput(entry.id, { ...toForm(entry, ""), altTitles: entryTitles.join("\n") }) : null;

    if (entryInput && "error" in entryInput) {
      setError({ message: entryInput.error, field: "altTitles" });

      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (entryInput) {
        await request("entries.save", entryInput);
      }

      await request("tags.save", { postId, tag: parsed.data });
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
    <>
      <Dialog open={open && entryEditor === null} onOpenChange={next => !next && onClose(false)}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-lg">
          <DialogHeader className="p-4 pr-10 pb-3">
            <DialogTitle>{tag ? "Edit reaction" : "Add a reaction"}</DialogTitle>
            <DialogDescription>What KOL reacted to in this post, and when.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4">
            <FieldSet disabled={saving}>
              <FieldGroup className="gap-4">
                <Field data-invalid={Boolean(fieldError("entryId"))}>
                  <FieldLabel htmlFor={`${formId}-entry`}>
                    What KOL reacted to
                    <span aria-hidden className="-ml-1.5 text-muted-foreground">*</span>
                  </FieldLabel>

                  <div className="flex items-center gap-1.5">
                    <Combobox
                      items={entries}
                      value={entry}
                      itemToStringLabel={toEntryLabel}
                      isItemEqualToValue={(option, value) => option.id === value.id}
                      filter={(option, query) => option.match(query.toLowerCase())}
                      onInputValueChange={value => setTyped(value)}
                      onValueChange={value => setEntryId(value?.id ?? null)}
                    >
                      <ComboboxInput
                        id={`${formId}-entry`}
                        required
                        placeholder="Search entries"
                        className="flex-1"
                        aria-invalid={Boolean(fieldError("entryId"))}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>No entry matches. Create one with +</ComboboxEmpty>
                        <ComboboxList>
                          {(option: Entry) => (
                            <ComboboxItem key={option.id} value={option}>
                              <span className="truncate">{option.title}</span>
                              <span className="ml-auto shrink-0 text-xs text-muted-foreground">{option.getTypeName()}</span>
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>

                    {entry && (
                      <Tooltip>
                        <TooltipTrigger
                          render={<Button variant="outline" size="icon" aria-label="edit entry" onClick={() => setEntryEditor({ entry, title: "" })} />}
                        >
                          <Pencil />
                        </TooltipTrigger>
                        <TooltipContent>Edit this entry</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger
                        render={<Button variant="outline" size="icon" aria-label="new entry" onClick={() => setEntryEditor({ entry: null, title: entry ? "" : typed })} />}
                      >
                        <Plus />
                      </TooltipTrigger>
                      <TooltipContent>New entry</TooltipContent>
                    </Tooltip>
                  </div>

                  <FieldError>{fieldError("entryId")}</FieldError>
                </Field>

                <Field data-invalid={Boolean(fieldError("label"))}>
                  <FieldLabel htmlFor={`${formId}-label`}>
                    {hasEpisodes(entry?.type) ? "Episode" : "Label"}
                    <span aria-hidden className="-ml-1.5 text-muted-foreground">*</span>
                  </FieldLabel>
                  <Input
                    id={`${formId}-label`}
                    required
                    placeholder={hasEpisodes(entry?.type) ? "e.g. 12" : "e.g. the video's name"}
                    value={label}
                    aria-invalid={Boolean(fieldError("label"))}
                    onChange={e => setLabel(e.target.value)}
                  />
                  <FieldError>{fieldError("label")}</FieldError>
                </Field>

                <Field data-invalid={Boolean(fieldError("description"))}>
                  <FieldLabel htmlFor={`${formId}-description`}>Hover text</FieldLabel>
                  <Input
                    id={`${formId}-description`}
                    placeholder={entry ? describeReaction(entry, label.trim()) : "e.g. Episode 7 of FROM"}
                    value={hoverText}
                    aria-invalid={Boolean(fieldError("description"))}
                    onChange={e => setDescription(e.target.value)}
                  />
                  {fieldError("description")
                    ? <FieldError>{fieldError("description")}</FieldError>
                    : <FieldDescription className="text-xs">Shown when hovering the reaction's chip</FieldDescription>}
                </Field>

                {isYouTube && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel htmlFor={`${formId}-video-title`}>Video title</FieldLabel>
                      <Input id={`${formId}-video-title`} value={videoTitle} onChange={e => setVideoTitle(e.target.value)} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={`${formId}-video-id`}>Video ID or link</FieldLabel>
                      <Input id={`${formId}-video-id`} value={videoId} onChange={e => setVideoId(e.target.value)} />
                    </Field>

                    {fieldError("context") && <FieldError className="col-span-2">{fieldError("context")}</FieldError>}
                  </div>
                )}

                {entry && (
                  <Field data-invalid={Boolean(fieldError("altTitles"))}>
                    <FieldLabel htmlFor={`${formId}-alt-titles`}>{isYouTube ? "Other video titles" : `Other titles of ${entry.title}`}</FieldLabel>
                    <Textarea
                      id={`${formId}-alt-titles`}
                      rows={2}
                      placeholder="e.g. short names KOL uses"
                      value={altTitles}
                      aria-invalid={Boolean(fieldError("altTitles"))}
                      onChange={e => setAltTitles(e.target.value)}
                    />
                    {fieldError("altTitles")
                      ? <FieldError>{fieldError("altTitles")}</FieldError>
                      : (
                          <FieldDescription className="text-xs">
                            {isYouTube ? "One per line. The shortest shows on the chip" : "One per line. Saved to the entry, for every reaction to it"}
                          </FieldDescription>
                        )}
                  </Field>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <TimeField label="Starts at" required value={startTime} onChange={setStartTime} error={fieldError("startTime")} />
                  <TimeField label="Ends at" required value={endTime} onChange={setEndTime} error={timesInvalid ? "Must be after the start" : fieldError("endTime")} />
                </div>

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
            <Button disabled={saving || timesInvalid} onClick={save}>
              {saving && <Spinner data-icon="inline-start" aria-hidden />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
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
