import type { Tag } from "../../../core/domain/tag";
import type { TReportKind } from "../../../core/schemas/moderation.schema";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { request } from "../../../core/messaging/client";
import { Alert, AlertDescription } from "../../ui/alert";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle } from "../../ui/field";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Spinner } from "../../ui/spinner";
import { Textarea } from "../../ui/textarea";
import { describeError } from "./errors";
import TimeField from "./TimeField";



/**
 * @description
 * What a report form asks for, by kind.
 */
const KINDS: Record<TReportKind, { title: string; summary: string; description: string; note: string; notePlaceholder: string; noteRequired: boolean; times: boolean }> = {
  timestamp: {
    title: "Wrong timestamp",
    summary: "It starts or ends at the wrong time",
    description: "Suggest when the reaction really starts and ends.",
    note: "Note",
    notePlaceholder: "Anything else a moderator should know",
    noteRequired: false,
    times: true,
  },
  entry: {
    title: "Wrong show or episode",
    summary: "KOL reacts to something else",
    description: "Tell the moderators what KOL really reacts to.",
    note: "What is it really?",
    notePlaceholder: "e.g. It's episode 5, not 4",
    noteRequired: true,
    times: false,
  },
  missing: {
    title: "Missing reaction",
    summary: "",
    description: "Tell the moderators what KOL reacts to, and when.",
    note: "What did KOL react to?",
    notePlaceholder: "e.g. One Piece episode 1100",
    noteRequired: true,
    times: true,
  },
  untracked: {
    title: "Track this post",
    summary: "",
    description: "Ask the moderators to add this post's reactions.",
    note: "Note",
    notePlaceholder: "e.g. What KOL reacts to in it",
    noteRequired: false,
    times: false,
  },
};

/**
 * @description
 * The kinds a viewer picks between when reporting a reaction.
 */
const TAG_KINDS: ReadonlyArray<TReportKind> = ["timestamp", "entry"];

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
  const id = useId();
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
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="p-4 pr-10 pb-3">
          <DialogTitle>{tag ? "Report a problem" : form.title}</DialogTitle>
          <DialogDescription>{form.description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4">
          {sent
            ? (
                <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/50 px-4 py-6 text-center">
                  <CircleCheck className="size-6 text-muted-foreground" />
                  <p className="font-medium">Thanks! A moderator will look at it.</p>
                </div>
              )
            : (
                <FieldSet disabled={sending}>
                  <FieldGroup className="gap-4">
                    {tag && (
                      <FieldSet className="gap-2">
                        <FieldLegend variant="label" className="mb-0">What is wrong?</FieldLegend>
                        <RadioGroup value={kind} className="grid-cols-2" onValueChange={value => setKind(value as TReportKind)}>
                          {TAG_KINDS.map(option => (
                            <FieldLabel key={option} htmlFor={`${id}-${option}`}>
                              <Field orientation="horizontal">
                                <RadioGroupItem id={`${id}-${option}`} value={option} />
                                <FieldContent>
                                  <FieldTitle>{KINDS[option].title}</FieldTitle>
                                  <FieldDescription className="text-xs">{KINDS[option].summary}</FieldDescription>
                                </FieldContent>
                              </Field>
                            </FieldLabel>
                          ))}
                        </RadioGroup>
                      </FieldSet>
                    )}

                    {form.times && (
                      <div className="grid grid-cols-2 gap-3">
                        <TimeField label="Starts at" value={startTime} onChange={setStartTime} />
                        <TimeField label="Ends at" value={endTime} onChange={setEndTime} error={timesInvalid ? "Must be after the start" : undefined} />
                      </div>
                    )}

                    <Field>
                      <FieldLabel htmlFor={`${id}-note`}>
                        {form.note}
                        {form.noteRequired && <span aria-hidden className="-ml-1.5 text-muted-foreground">*</span>}
                      </FieldLabel>
                      <Textarea
                        id={`${id}-note`}
                        value={note}
                        required={form.noteRequired}
                        placeholder={form.notePlaceholder}
                        className="max-h-40 min-h-20"
                        onChange={e => setNote(e.target.value.slice(0, 500))}
                      />
                      <FieldDescription className="text-right text-xs tabular-nums">{`${note.length}/500`}</FieldDescription>
                    </Field>

                    {error && (
                      <Alert variant="destructive">
                        <CircleAlert />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </FieldGroup>
                </FieldSet>
              )}
        </div>

        <DialogFooter className="m-0">
          <Button variant="outline" onClick={onClose}>{sent ? "Close" : "Cancel"}</Button>
          {!sent && (
            <Button disabled={!canSend} onClick={send}>
              {sending && <Spinner data-icon="inline-start" aria-hidden />}
              Send report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReportDialog;
