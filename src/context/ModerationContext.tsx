import type { ReactNode } from "react";
import type { Post } from "../core/domain/post";
import type { Tag } from "../core/domain/tag";
import type { TReport, TReportKind } from "../core/schemas/moderation.schema";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ConfirmDialog from "../components/layout/moderation/ConfirmDialog";
import PostDetailsDialog from "../components/layout/moderation/PostDetailsDialog";
import ReactionEditorDialog from "../components/layout/moderation/ReactionEditorDialog";
import ReportDialog from "../components/layout/moderation/ReportDialog";
import ReportsReviewDialog from "../components/layout/moderation/ReportsReviewDialog";
import { request } from "../core/messaging/client";
import { selectReports, useReportsStore } from "../state/reports.state";



/**
 * @description
 * What a post's panel can ask for: reports for everyone signed in, the
 * rest for moderators.
 */
export interface IModerationContext {

  /**
   * @description
   * Opens the report form, about a reaction or the post.
   */
  report: (kind: TReportKind, tag?: Tag) => void;

  /**
   * @description
   * Opens the reaction editor, for a reaction or a new one.
   */
  editTag: (tag: Tag | null) => void;

  /**
   * @description
   * Asks, then removes a reaction.
   */
  deleteTag: (tag: Tag) => void;

  /**
   * @description
   * Opens the post's details.
   */
  editPost: () => void;

  /**
   * @description
   * Asks, then stops tracking the post.
   */
  untrackPost: () => void;

  /**
   * @description
   * Opens the open reports about a reaction, or about the post itself.
   */
  review: (tagId?: string) => void;
}

const noop = () => undefined;

export const ModerationContext = createContext<IModerationContext>({
  report: noop,
  editTag: noop,
  deleteTag: noop,
  editPost: noop,
  untrackPost: noop,
  review: noop,
});

/**
 * @description
 * The reaction editor's state: what it edits, and the report it fixes.
 */
interface IEditorState {
  tag: Tag | null;
  initial?: { startTime?: number; endTime?: number };
  report?: TReport;
}

/**
 * @description
 * Moderation provider props.
 */
interface IModerationProviderProps {
  post: Post;
  children: ReactNode;
}

/**
 * @description
 * Provides a post panel's moderation actions, and renders their dialogs.
 *
 * @param props - The post and the panel
 * @returns The provider
 */
export function ModerationProvider(props: IModerationProviderProps): JSX.Element {
  const { post, children } = props;
  const reports = useReportsStore(e => e.reports);
  const [reportForm, setReportForm] = useState<{ kind: TReportKind; tag: Tag | null } | null>(null);
  const [editor, setEditor] = useState<IEditorState | null>(null);
  const [details, setDetails] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; message: string; label: string; action: () => Promise<unknown> } | null>(null);
  const [reviewing, setReviewing] = useState<{ tagId?: string } | null>(null);
  const reviewed = reviewing ? selectReports(reports, post.id, reviewing.tagId) : [];
  const reviewedTag = reviewing?.tagId ? post.tags.find(tag => tag.id === reviewing.tagId) : undefined;

  const findTag = (report: TReport) => report.tagId ? post.tags.find(tag => tag.id === report.tagId) : undefined;

  const canApply = (report: TReport) => report.kind === "missing" || ((report.kind === "timestamp" || report.kind === "entry") && findTag(report) !== undefined);

  const apply = (report: TReport) => {
    const times = { startTime: report.startTime, endTime: report.endTime };

    setReviewing(null);
    setEditor(report.kind === "missing"
      ? { tag: null, initial: times, report }
      : { tag: findTag(report) ?? null, initial: report.kind === "timestamp" ? times : undefined, report });
  };

  const closeEditor = (saved: boolean) => {
    const fixed = editor?.report;

    setEditor(null);

    if (saved && fixed) {
      request("reports.resolve", { reportId: fixed.id }).catch(() => undefined);
    }
  };

  const report = useCallback((kind: TReportKind, tag?: Tag) => setReportForm({ kind, tag: tag ?? null }), []);
  const editTag = useCallback((tag: Tag | null) => setEditor({ tag }), []);
  const editPost = useCallback(() => setDetails(true), []);
  const review = useCallback((tagId?: string) => setReviewing({ tagId }), []);

  const deleteTag = useCallback((tag: Tag) => setConfirm({
    title: "Delete this reaction?",
    message: `“${tag.getTitle()} — ${tag.getDetailDescription()}” will be removed for everyone.`,
    label: "Delete",
    action: () => request("tags.delete", { postId: post.id, tagId: tag.id }),
  }), [post.id]);

  const untrackPost = useCallback(() => setConfirm({
    title: "Stop tracking this post?",
    message: `“${post.title}” and its ${post.tags.length} reactions will be removed for everyone.`,
    label: "Stop tracking",
    action: () => request("posts.delete", { postId: post.id }),
  }), [post]);

  const value = useMemo(() => ({ report, editTag, deleteTag, editPost, untrackPost, review }), [report, editTag, deleteTag, editPost, untrackPost, review]);

  return (
    <ModerationContext.Provider value={value}>
      {children}

      <ReportDialog
        open={reportForm !== null}
        kind={reportForm?.kind ?? "missing"}
        post={{ id: post.id, title: post.title }}
        tag={reportForm?.tag}
        onClose={() => setReportForm(null)}
      />

      <ReactionEditorDialog
        open={editor !== null}
        postId={post.id}
        tag={editor?.tag ?? null}
        initial={editor?.initial}
        onClose={closeEditor}
      />

      <PostDetailsDialog
        open={details}
        tracked={true}
        post={{ id: post.id, title: post.title, description: post.description, creationDate: post.creationDate.getTime(), thumbnail: post.thumbnail }}
        onClose={() => setDetails(false)}
      />

      <ReportsReviewDialog
        open={reviewing !== null}
        title={reviewedTag ? `Reports on ${reviewedTag.getTitle()} — ${reviewedTag.getDetailDescription()}` : "Reports on this post"}
        reports={reviewed}
        canApply={canApply}
        onApply={apply}
        onClose={() => setReviewing(null)}
      />

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel={confirm?.label ?? ""}
        onConfirm={confirm?.action ?? (async () => undefined)}
        onClose={() => setConfirm(null)}
      />
    </ModerationContext.Provider>
  );
}

/**
 * @description
 * The enclosing post panel's moderation actions.
 *
 * @returns The actions
 */
export function useModeration(): IModerationContext {
  return useContext(ModerationContext);
}
