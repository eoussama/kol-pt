import type { ReactNode } from "react";
import type { Entry } from "../../../core/domain/entry";
import type { TEntryType } from "../../../core/enums/entry-type.enum";
import type { TEntryInput } from "../../../core/schemas/moderation.schema";

import { CircleAlert } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import { EntryInputSchema } from "../../../core/schemas/moderation.schema";
import { useEntriesStore } from "../../../state/entries.state";
import { Alert, AlertDescription } from "../../ui/alert";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "../../ui/field";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Spinner } from "../../ui/spinner";
import { Textarea } from "../../ui/textarea";
import { describeError } from "./errors";



/**
 * @description
 * Entry types, as the editor lists them.
 */
const TYPES: Array<[TEntryType, string]> = [
  [EEntryType.ANIME, "Anime"],
  [EEntryType.TV_SHOW, "TV Show"],
  [EEntryType.MOVIE, "Movie"],
  [EEntryType.CARTOON, "Cartoon"],
  [EEntryType.YOUTUBE, "YouTube channel"],
];

/**
 * @description
 * Entry types, as the type picker shows the one picked.
 */
const TYPE_ITEMS = TYPES.map(([value, label]) => ({ value, label }));

/**
 * @description
 * The entry form's fields, all as typed.
 */
type TEntryForm = Record<"title" | "altTitles" | "imdbId" | "cover" | "malId" | "anilistId" | "kitsuId" | "handle" | "channelId" | "rottentomatoesId", string> & { type: TEntryType };

/**
 * @description
 * The extra fields of each entry type.
 */
const TYPE_FIELDS: Record<TEntryType, Array<[keyof TEntryForm, string, string?]>> = {
  [EEntryType.ANIME]: [["malId", "MyAnimeList ID", "e.g. 21"], ["anilistId", "AniList ID", "e.g. 21"], ["kitsuId", "Kitsu ID", "e.g. 12"]],
  [EEntryType.YOUTUBE]: [["handle", "Channel handle", "Without the @"], ["channelId", "Channel ID", "e.g. UC..."]],
  [EEntryType.MOVIE]: [["rottentomatoesId", "Rotten Tomatoes ID", "e.g. the_matrix"]],
  [EEntryType.TV_SHOW]: [],
  [EEntryType.CARTOON]: [],
};

/**
 * @description
 * Fills the form from an entry.
 *
 * @param entry - The entry to edit, or null for a new one
 * @param title - The title to start a new entry with
 * @returns The form's fields
 */
function toForm(entry: Entry | null, title: string): TEntryForm {
  const model = (entry?.model ?? {}) as Partial<Record<keyof TEntryForm, unknown>>;
  const text = (value: unknown) => value === undefined || value === null ? "" : String(value);

  return {
    type: entry?.type ?? EEntryType.ANIME,
    title: entry?.title ?? title,
    altTitles: (entry?.altTitles ?? []).join("\n"),
    imdbId: text(model.imdbId),
    cover: text(model.cover),
    malId: text(model.malId),
    anilistId: text(model.anilistId),
    kitsuId: text(model.kitsuId),
    handle: text(model.handle),
    channelId: text(model.channelId),
    rottentomatoesId: text(model.rottentomatoesId),
  };
}

/**
 * @description
 * Turns the form into an entry to save, keeping only its type's fields.
 *
 * @param id - The entry's ID
 * @param form - The form's fields
 * @returns The entry, or why it is not valid and which field is at fault
 */
export function toEntryInput(id: string, form: TEntryForm): { entry: TEntryInput } | { error: string; field?: keyof TEntryForm } {
  const number = (value: string) => value.trim() ? Number(value.trim()) : undefined;
  const fields = Object.fromEntries(TYPE_FIELDS[form.type].map(([field]) => {
    const value = form[field] as string;

    return [field, field === "malId" || field === "anilistId" ? number(value) : value];
  }));

  const parsed = EntryInputSchema.safeParse({
    id,
    type: form.type,
    title: form.title,
    imdbId: form.imdbId,
    cover: form.cover,
    altTitles: form.altTitles.split("\n").map(title => title.trim()).filter(Boolean),
    ...fields,
  });

  if (parsed.success) {
    return { entry: parsed.data };
  }

  const issue = parsed.error.issues[0];
  const field = issue?.path[0];

  return { error: issue?.message ?? "Check the fields", field: typeof field === "string" && field in form ? field as keyof TEntryForm : undefined };
}

/**
 * @description
 * A labelled form field, with its hint and its problem under it.
 *
 * @param props - The field's parts
 * @param props.id - The ID of the control it labels
 * @param props.label - The label
 * @param props.required - Whether the field must be filled
 * @param props.disabled - Whether the control is disabled
 * @param props.description - A hint shown under the control
 * @param props.error - A problem shown under the control
 * @param props.children - The control
 * @returns The field
 */
function FormField(props: { id: string; label: string; required?: boolean; disabled?: boolean; description?: string; error?: string; children: ReactNode }): JSX.Element {
  const { id, label, required, disabled, description, error, children } = props;

  return (
    <Field data-invalid={Boolean(error)} data-disabled={disabled}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <span aria-hidden className="-ml-1.5 text-muted-foreground">*</span>}
      </FieldLabel>
      {children}
      {description && !error && <FieldDescription className="text-xs">{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

/**
 * @description
 * Entry editor props.
 */
export interface IEntryEditorDialogProps {
  open: boolean;

  /**
   * @description
   * The entry to edit, or null to create one.
   */
  entry: Entry | null;

  /**
   * @description
   * The title to start a new entry with, e.g. what was typed in the picker.
   */
  initialTitle?: string;

  /**
   * @description
   * Called when the dialog closes, with the saved entry's ID if one was saved.
   */
  onClose: (savedId?: string) => void;
}

/**
 * @description
 * Creates or edits an entry: what KOL reacts to. Moderators only.
 *
 * @param props - The entry, and what to do once closed
 * @returns The dialog
 */
function EntryEditorDialog(props: IEntryEditorDialogProps): JSX.Element {
  const { open, entry, initialTitle = "", onClose } = props;
  const formId = useId();
  const loadEntries = useEntriesStore(e => e.loadEntries);
  const [form, setForm] = useState<TEntryForm>(() => toForm(entry, initialTitle));
  const [saving, setSaving] = useState(false);
  // A problem with a field is shown under it, any other one under the form
  const [error, setError] = useState<{ message: string; field?: keyof TEntryForm } | null>(null);
  const fieldError = (field: keyof TEntryForm) => error?.field === field ? error.message : undefined;

  useEffect(() => {
    if (open) {
      setForm(toForm(entry, initialTitle));
      setError(null);
    }
  }, [open, entry, initialTitle]);

  const set = (field: keyof TEntryForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(current => ({ ...current, [field]: e.target.value }));

  const save = async () => {
    const id = entry?.id ?? crypto.randomUUID();
    const result = toEntryInput(id, form);

    if ("error" in result) {
      setError({ message: result.error, field: result.field });

      return;
    }

    setSaving(true);
    setError(null);

    try {
      await request("entries.save", { entry: result.entry });
      await loadEntries(false);
      onClose(id);
    }
    catch (failure) {
      setError({ message: describeError(failure) });
    }
    finally {
      setSaving(false);
    }
  };

  /**
   * @description
   * Renders one of the entry's IDs on another site.
   *
   * @param field - The form field
   * @param label - Its label
   * @param placeholder - An example value
   * @param disabled - Whether the field does not apply to the type picked
   * @returns The field
   */
  const idField = (field: keyof TEntryForm, label: string, placeholder?: string, disabled = false) => (
    <FormField key={field} id={`${formId}-${field}`} label={label} disabled={disabled} error={fieldError(field)}>
      <Input
        id={`${formId}-${field}`}
        value={form[field]}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(fieldError(field))}
        onChange={set(field)}
      />
    </FormField>
  );

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="p-4 pr-10 pb-3">
          <DialogTitle>{entry ? "Edit entry" : "New entry"}</DialogTitle>
          <DialogDescription>What KOL reacts to: a show, a movie or a YouTube channel.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4">
          <FieldSet disabled={saving}>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-3">
                <FormField id={`${formId}-type`} label="Type">
                  <Select
                    items={TYPE_ITEMS}
                    value={form.type}
                    onValueChange={(value) => {
                      if (value !== null) {
                        setForm(current => ({ ...current, type: value }));
                      }
                    }}
                  >
                    <SelectTrigger id={`${formId}-type`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map(([type, name]) => <SelectItem key={type} value={type}>{name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField id={`${formId}-title`} label="Title" required error={fieldError("title")}>
                  <Input id={`${formId}-title`} value={form.title} required aria-invalid={Boolean(fieldError("title"))} onChange={set("title")} />
                </FormField>
              </div>

              <FormField id={`${formId}-altTitles`} label="Other titles" description="One per line, e.g. short names KOL uses" error={fieldError("altTitles")}>
                <Textarea
                  id={`${formId}-altTitles`}
                  value={form.altTitles}
                  className="max-h-40"
                  aria-invalid={Boolean(fieldError("altTitles"))}
                  onChange={set("altTitles")}
                />
              </FormField>

              <FormField
                id={`${formId}-cover`}
                label="Cover link"
                description={form.type === EEntryType.ANIME || form.type === EEntryType.YOUTUBE ? "Optional: MyAnimeList and YouTube provide one" : "An https link, e.g. from TMDB or IMDb"}
                error={fieldError("cover")}
              >
                <Input id={`${formId}-cover`} type="url" value={form.cover} placeholder="https://..." aria-invalid={Boolean(fieldError("cover"))} onChange={set("cover")} />
              </FormField>

              <FieldSet className="gap-3">
                <FieldLegend variant="label" className="mb-0">IDs on other sites</FieldLegend>

                <div className="grid grid-cols-2 gap-3">
                  {idField("imdbId", "IMDb ID", "e.g. tt0388629")}

                  {/* The anime IDs stay visible for other types, so changing the type back loses nothing */}
                  {TYPE_FIELDS[EEntryType.ANIME].map(([field, label, placeholder]) => idField(field, label, placeholder, form.type !== EEntryType.ANIME))}

                  {form.type !== EEntryType.ANIME && TYPE_FIELDS[form.type].map(([field, label, placeholder]) => idField(field, label, placeholder))}
                </div>
              </FieldSet>

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
          <Button variant="outline" onClick={() => onClose()}>Cancel</Button>
          <Button disabled={saving || !form.title.trim()} onClick={save}>
            {saving && <Spinner data-icon="inline-start" aria-hidden />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EntryEditorDialog;
