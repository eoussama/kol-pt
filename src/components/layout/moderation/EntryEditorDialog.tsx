import type { Entry } from "../../../core/domain/entry";
import type { TEntryType } from "../../../core/enums/entry-type.enum";
import type { TEntryInput } from "../../../core/schemas/moderation.schema";

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import { EntryInputSchema } from "../../../core/schemas/moderation.schema";
import { useEntriesStore } from "../../../state/entries.state";
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
 * @returns The entry, or why it is not valid
 */
export function toEntryInput(id: string, form: TEntryForm): { entry: TEntryInput } | { error: string } {
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

  return parsed.success ? { entry: parsed.data } : { error: parsed.error.issues[0]?.message ?? "Check the fields" };
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
  const loadEntries = useEntriesStore(e => e.loadEntries);
  const [form, setForm] = useState<TEntryForm>(() => toForm(entry, initialTitle));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(entry, initialTitle));
      setError(null);
    }
  }, [open, entry, initialTitle]);

  const set = (field: keyof TEntryForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(current => ({ ...current, [field]: field === "type" ? Number(e.target.value) as TEntryType : e.target.value }));

  const save = async () => {
    const id = entry?.id ?? crypto.randomUUID();
    const result = toEntryInput(id, form);

    if ("error" in result) {
      setError(result.error);

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
      setError(describeError(failure));
    }
    finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose()} fullWidth maxWidth="xs">
      <DialogTitle>{entry ? "Edit entry" : "New entry"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select size="small" label="Type" value={form.type} onChange={set("type")}>
            {TYPES.map(([type, name]) => <MenuItem key={type} value={type}>{name}</MenuItem>)}
          </TextField>

          <TextField size="small" label="Title" required value={form.title} onChange={set("title")} />

          <TextField
            multiline
            minRows={2}
            size="small"
            label="Other titles"
            value={form.altTitles}
            helperText="One per line, e.g. short names KOL uses"
            onChange={set("altTitles")}
          />

          <TextField size="small" label="IMDb ID" placeholder="e.g. tt0388629" value={form.imdbId} onChange={set("imdbId")} />

          <TextField
            size="small"
            label="Cover link"
            placeholder="https://..."
            value={form.cover}
            onChange={set("cover")}
            helperText={form.type === EEntryType.ANIME || form.type === EEntryType.YOUTUBE ? "Optional: MyAnimeList and YouTube provide one" : "An https link, e.g. from TMDB or IMDb"}
          />

          {/* The anime IDs stay visible for other types, so changing the type back loses nothing */}
          {TYPE_FIELDS[EEntryType.ANIME].map(([field, label, placeholder]) => (
            <TextField key={field} size="small" label={label} placeholder={placeholder} value={form[field]} disabled={form.type !== EEntryType.ANIME} onChange={set(field)} />
          ))}

          {form.type !== EEntryType.ANIME && TYPE_FIELDS[form.type].map(([field, label, placeholder]) => (
            <TextField key={field} size="small" label={label} placeholder={placeholder} value={form[field]} onChange={set(field)} />
          ))}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose()}>Cancel</Button>
        <Button variant="contained" disableElevation disabled={saving || !form.title.trim()} onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default EntryEditorDialog;
