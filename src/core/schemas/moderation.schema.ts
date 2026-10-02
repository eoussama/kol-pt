import { z } from "zod";
import { EEntryType } from "../enums/entry-type.enum";
import { ALLOWED_IMAGE_SITES, isAllowedImageUrl } from "../utils/image-hosts";



/**
 * @description
 * A short, required line of text.
 *
 * @param max - The longest it may be
 * @returns The schema
 */
const line = (max: number) => z.string().trim().min(1).max(max);

/**
 * @description
 * An optional identifier on another site, dropped when empty.
 */
const externalId = z.string().trim().max(200).optional().transform(value => value || undefined);

/**
 * @description
 * An optional cover image link, dropped when empty. Only sites the extension
 * can show covers from are accepted.
 */
const coverLink = z.string().trim().max(500).optional().transform(value => value || undefined).refine(value => value === undefined || isAllowedImageUrl(value), { message: `The cover must be an https link from ${ALLOWED_IMAGE_SITES}` });

/**
 * @description
 * A position in a video, in seconds.
 */
const seconds = z.number().finite().nonnegative().max(86400);

/**
 * @description
 * A tracked post, as a moderator saves it. Its reactions are saved separately.
 */
export const PostInputSchema = z.object({
  id: line(300),
  title: line(300),
  description: z.string().max(5000).default(""),
  creationDate: z.number().int().positive(),
  thumbnail: z.union([z.url({ protocol: /^https$/ }), z.literal("")]).default(""),
});

export type TPostInput = z.infer<typeof PostInputSchema>;

/**
 * @description
 * A reaction, as a moderator saves it.
 */
export const TagInputSchema = z.object({
  id: line(100),
  entryId: line(100),
  label: line(200),
  description: z.string().max(1000).default(""),
  startTime: seconds,
  endTime: seconds,
  context: z.object({
    title: z.string().trim().max(300).optional(),
    videoId: z.string().trim().max(50).optional(),
    altTitles: z.array(line(300)).max(20).optional(),
  }).default({}),
}).refine(tag => tag.endTime > tag.startTime, { message: "A reaction must end after it starts", path: ["endTime"] });

export type TTagInput = z.infer<typeof TagInputSchema>;

/**
 * @description
 * What every entry has, as a moderator saves it.
 */
const BaseEntryInputSchema = z.object({
  id: line(100),
  title: line(300),
  altTitles: z.array(line(300)).max(30).default([]),
  imdbId: externalId,
  cover: coverLink,
});

/**
 * @description
 * An entry, as a moderator saves it, by type.
 */
export const EntryInputSchema = z.discriminatedUnion("type", [
  BaseEntryInputSchema.extend({
    type: z.literal(EEntryType.ANIME),
    malId: z.number().int().positive().optional(),
    anilistId: z.number().int().positive().optional(),
    kitsuId: externalId,
  }),
  BaseEntryInputSchema.extend({
    type: z.literal(EEntryType.MOVIE),
    rottentomatoesId: externalId,
  }),
  BaseEntryInputSchema.extend({
    type: z.literal(EEntryType.TV_SHOW),
  }),
  BaseEntryInputSchema.extend({
    type: z.literal(EEntryType.CARTOON),
  }),
  BaseEntryInputSchema.extend({
    type: z.literal(EEntryType.YOUTUBE),
    handle: externalId,
    channelId: externalId,
  }),
]);

export type TEntryInput = z.infer<typeof EntryInputSchema>;

/**
 * @description
 * What a report is about.
 * - `timestamp`: a reaction starts or ends at the wrong time
 * - `entry`: a reaction is about the wrong show, video or episode
 * - `missing`: a post lacks a reaction
 * - `untracked`: a video post is not tracked at all
 */
export const ReportKindSchema = z.enum(["timestamp", "entry", "missing", "untracked"]);

export type TReportKind = z.infer<typeof ReportKindSchema>;

/**
 * @description
 * A report, as a viewer files it.
 */
export const ReportInputSchema = z.object({
  kind: ReportKindSchema,
  postId: line(300),
  postTitle: z.string().trim().max(300).default(""),
  tagId: line(100).optional(),
  tagTitle: z.string().trim().max(300).optional(),
  note: z.string().trim().max(500).default(""),
  startTime: seconds.optional(),
  endTime: seconds.optional(),
}).refine(report => (report.kind === "timestamp" || report.kind === "entry") === (report.tagId !== undefined), {
  message: "Only reports about a reaction name one",
  path: ["tagId"],
});

export type TReportInput = z.infer<typeof ReportInputSchema>;

/**
 * @description
 * A stored report: what the viewer filed, who filed it and when.
 */
export const ReportSchema = z.looseObject({
  id: z.string(),
  kind: ReportKindSchema,
  postId: z.string(),
  postTitle: z.string().optional().default(""),
  tagId: z.string().optional(),
  tagTitle: z.string().optional(),
  note: z.string().optional().default(""),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  reporterUid: z.string(),
  reporterName: z.string().optional().default(""),
  createdAt: z.number(),
});

export type TReport = z.infer<typeof ReportSchema>;
