import type { IPostDetails } from "../../../../core/schemas/api/patreon-post.schema";

import { Flag, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { readPostDetails } from "../../../../content/patreon/post-card";
import { request } from "../../../../core/messaging/client";
import { useAuthStore } from "../../../../state/auth.state";
import { selectReports, useReportsStore } from "../../../../state/reports.state";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Spinner } from "../../../ui/spinner";
import PostDetailsDialog from "../../moderation/PostDetailsDialog";
import ReportDialog from "../../moderation/ReportDialog";
import ReportsReviewDialog from "../../moderation/ReportsReviewDialog";



/**
 * @description
 * Untracked post props.
 */
interface IUntrackedPostProps {
  card: HTMLElement;

  /**
   * @description
   * Patreon's numeric id of the post.
   */
  postId: string;
}

/**
 * @description
 * A slim bar under the creator's video posts that are not tracked: viewers
 * can ask for them to be tracked, moderators can track them.
 *
 * @param props - The post's card and id
 * @returns The bar, or nothing when signed out
 */
function UntrackedPost(props: IUntrackedPostProps): JSX.Element | null {
  const { card, postId } = props;
  const user = useAuthStore(e => e.user);
  const moderator = useAuthStore(e => e.moderator);
  const allReports = useReportsStore(e => e.reports);
  const [dialog, setDialog] = useState<"report" | "track" | "review" | null>(null);
  const [published, setPublished] = useState<IPostDetails | null>(null);
  const [fetching, setFetching] = useState(false);
  const reports = moderator ? selectReports(allReports, postId, undefined) : [];

  // Read when a dialog opens, as Patreon fills the card in over time. The
  // post is dated when it was published, not when it gets tracked.
  const details = useMemo(() => ({
    ...readPostDetails(card, postId, window.location.href),
    creationDate: published?.publishedAt ?? Date.now(),
    thumbnail: published?.thumbnail ?? "",
  }), [card, postId, dialog, published]);

  /**
   * @description
   * Opens the tracking form once Patreon told when the post was published,
   * and its video's thumbnail, so they are filled in from the start.
   */
  const openTrack = () => {
    setFetching(true);
    request("posts.details", { postId })
      .then(setPublished)
      .catch(() => setPublished(null))
      .finally(() => {
        setFetching(false);
        setDialog("track");
      });
  };

  if (!user) {
    return null;
  }

  const closeTrack = (saved: boolean) => {
    setDialog(null);

    if (saved) {
      reports.forEach(report => request("reports.resolve", { reportId: report.id }).catch(() => undefined));
    }
  };

  return (
    <div className="my-2.5 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed bg-card py-2 pr-2 pl-3">
      <Zap className="size-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">KOL PT does not track this post yet.</span>

      {reports.length > 0 && (
        <Badge
          variant="outline"
          className="cursor-pointer border-warning/40 text-warning hover:bg-warning/10"
          render={<button type="button" onClick={() => setDialog("review")} />}
        >
          <Flag />
          {reports.length === 1 ? "1 request" : `${reports.length} requests`}
        </Badge>
      )}

      <Button size="sm" variant={moderator ? "default" : "outline"} className="ml-auto" disabled={fetching} onClick={() => moderator ? openTrack() : setDialog("report")}>
        {fetching && <Spinner data-icon="inline-start" aria-hidden />}
        {moderator ? "Track post" : "Ask to track"}
      </Button>

      <ReportDialog open={dialog === "report"} kind="untracked" post={details} onClose={() => setDialog(null)} />

      {moderator && (
        <>
          <PostDetailsDialog open={dialog === "track"} tracked={false} post={details} onClose={closeTrack} />
          <ReportsReviewDialog
            open={dialog === "review"}
            title="Requests to track this post"
            reports={reports}
            canApply={() => true}
            onApply={openTrack}
            onClose={() => setDialog(null)}
          />
        </>
      )}
    </div>
  );
}

export default UntrackedPost;
