import type { TReport } from "../../../core/schemas/moderation.schema";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { request } from "../../../core/messaging/client";
import ReportsReviewDialog from "./ReportsReviewDialog";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

const createdAt = new Date(2024, 0, 15, 13, 45).getTime();

const timestampReport: TReport = { id: "r1", kind: "timestamp", postId: "post-1001", postTitle: "Anime Tonight", tagId: "t1", tagTitle: "Frieren — Episode 4", note: "Starts later", startTime: 10, endTime: 20, reporterUid: "u1", reporterName: "Viewer", createdAt };
const missingReport: TReport = { id: "r2", kind: "missing", postId: "post-1001", postTitle: "Anime Tonight", note: "", reporterUid: "u2", reporterName: "", createdAt };

/**
 * @description
 * Renders an open review dialog.
 *
 * @param reports - The reports to review
 * @param props - What to override
 * @param props.canApply - Whether a report can be fixed from here
 * @param props.onApply - Called to fix a report
 * @param props.onClose - Called when the dialog closes
 */
function renderDialog(reports: Array<TReport>, props: { canApply?: (report: TReport) => boolean; onApply?: (report: TReport) => void; onClose?: () => void } = {}): void {
  render(<ReportsReviewDialog open title="Reports on this post" reports={reports} canApply={props.canApply ?? (() => true)} onApply={props.onApply ?? vi.fn()} onClose={props.onClose ?? vi.fn()} />);
}

describe("reportsReviewDialog", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue(null as never);
  });

  it("says when there are no open reports", () => {
    renderDialog([]);

    expect(screen.getByRole("heading", { name: "Reports on this post" })).toBeInTheDocument();
    expect(screen.getByText("No open reports.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("describes each report", () => {
    renderDialog([timestampReport, missingReport]);

    const [first, second] = screen.getAllByRole("listitem");

    expect(screen.queryByText("No open reports.")).not.toBeInTheDocument();
    expect(first).toHaveTextContent("Wrong timestamp");
    expect(first).toHaveTextContent(`Viewer · ${new Date(createdAt).toLocaleString()}`);
    expect(first).toHaveTextContent("Frieren — Episode 4");
    expect(first).toHaveTextContent("Suggested: 0:00:10 → 0:00:20");
    expect(first).toHaveTextContent("“Starts later”");
    expect(second).toHaveTextContent("Missing reaction");
    expect(second).toHaveTextContent(`A viewer · ${new Date(createdAt).toLocaleString()}`);
  });

  it("leaves out what a report does not have", () => {
    renderDialog([missingReport]);

    const item = screen.getByRole("listitem");

    expect(item).not.toHaveTextContent("Suggested");
    expect(item).not.toHaveTextContent("“");
    expect(item.querySelectorAll("p")).toHaveLength(0);
  });

  it("fixes a report that can be fixed", () => {
    const onApply = vi.fn();

    renderDialog([timestampReport, missingReport], { onApply });
    fireEvent.click(within(screen.getAllByRole("listitem")[1]!).getByRole("button", { name: "Fix" }));

    expect(onApply).toHaveBeenCalledExactlyOnceWith(missingReport);
  });

  it("offers no fix for a report that cannot be fixed from here", () => {
    renderDialog([timestampReport, missingReport], { canApply: report => report.kind === "missing" });

    const [first, second] = screen.getAllByRole("listitem");

    expect(within(first!).queryByRole("button", { name: "Fix" })).not.toBeInTheDocument();
    expect(within(first!).getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    expect(within(second!).getByRole("button", { name: "Fix" })).toBeInTheDocument();
  });

  it("dismisses a report, busy only on that one", async () => {
    let finish: () => void = () => undefined;

    requestMock.mockImplementation((() => new Promise<null>((resolve) => {
      finish = () => resolve(null);
    })) as never);
    renderDialog([timestampReport, missingReport]);

    const [first, second] = screen.getAllByRole("listitem");

    fireEvent.click(within(first!).getByRole("button", { name: "Dismiss" }));

    await waitFor(() => expect(within(first!).getByRole("button", { name: "Dismiss" })).toBeDisabled());
    expect(requestMock).toHaveBeenCalledExactlyOnceWith("reports.resolve", { reportId: "r1" });
    expect(within(second!).getByRole("button", { name: "Dismiss" })).toBeEnabled();
    expect(within(first!).getByRole("button", { name: "Dismiss" }).querySelector("[data-icon=inline-start]")).not.toBeNull();
    expect(within(second!).getByRole("button", { name: "Dismiss" }).querySelector("[data-icon=inline-start]")).toBeNull();

    finish();

    await waitFor(() => expect(within(first!).getByRole("button", { name: "Dismiss" })).toBeEnabled());
    expect(within(first!).getByRole("button", { name: "Dismiss" }).querySelector("[data-icon=inline-start]")).toBeNull();
  });

  it("shows why a report could not be dismissed, until the next try", async () => {
    requestMock.mockRejectedValueOnce(new Error("Offline"));
    renderDialog([timestampReport]);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("closes from its footer", () => {
    const onClose = vi.fn();

    renderDialog([], { onClose });
    fireEvent.click(screen.getAllByRole("button", { name: "Close" }).find(button => button.closest("[data-slot=dialog-footer]") !== null)!);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes when dismissed", async () => {
    const onClose = vi.fn();

    renderDialog([], { onClose });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});
