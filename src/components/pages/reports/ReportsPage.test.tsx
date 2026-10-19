import type { TReport } from "../../../core/schemas/moderation.schema";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { request } from "../../../core/messaging/client";
import { formatTimestamp } from "../../../core/utils/time";
import { useAuthStore } from "../../../state/auth.state";
import { useReportsStore } from "../../../state/reports.state";
import ReportsPage from "./ReportsPage";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));

/**
 * @description
 * Builds a report.
 *
 * @param overrides - What differs from a bare report about a post
 * @returns The report
 */
function report(overrides: Partial<TReport>): TReport {
  return { id: "r0", kind: "untracked", postId: "post-0", postTitle: "", note: "", reporterUid: "u2", reporterName: "", createdAt: 0, ...overrides };
}

const createdAt = new Date(2024, 4, 6, 8, 15).getTime();
const reports = [
  report({ id: "r1", kind: "timestamp", postId: "post-1", postTitle: "Anime Tonight", tagId: "t1", tagTitle: "Frieren - 4", startTime: 720, endTime: 1440, note: "Starts too early", reporterName: "Mina", createdAt }),
  report({ id: "r2", kind: "untracked", postId: "post-2", postTitle: "Mystery Stream", createdAt }),
  report({ id: "r3", kind: "missing", postId: "post-3", createdAt }),
];

describe("reportsPage", () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
    vi.mocked(request).mockResolvedValue(null as never);
    vi.spyOn(window, "open").mockReturnValue(null);
    useAuthStore.setState({ moderator: true });
    useReportsStore.setState({ reports });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reloads the reports on every visit", async () => {
    render(<ReportsPage />);

    await waitFor(() => expect(request).toHaveBeenCalledWith("moderation.refresh", {}));
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("shows a spinner to someone who may not be a moderator while it checks", () => {
    useAuthStore.setState({ moderator: false });
    vi.mocked(request).mockReturnValue(new Promise(() => undefined) as never);

    const { container } = render(<ReportsPage />);

    expect(container.querySelector("[role=status]")).not.toBeNull();
    expect(screen.queryByText("Only moderators can see reports")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("tells everyone else that only moderators can see reports", async () => {
    useAuthStore.setState({ moderator: false });

    render(<ReportsPage />);

    expect(await screen.findByText("Only moderators can see reports")).toBeInTheDocument();
    expect(screen.queryByText("Starts too early")).not.toBeInTheDocument();
  });

  it("shows a skeleton while the first reports load", () => {
    useReportsStore.setState({ reports: [] });
    vi.mocked(request).mockReturnValue(new Promise(() => undefined) as never);

    render(<ReportsPage />);

    expect(screen.getByLabelText("Loading reports")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Loading reports").children).toHaveLength(4);
    expect(screen.queryByText("No open reports. Nice!")).not.toBeInTheDocument();
  });

  it("keeps the reports in view while they reload", () => {
    vi.mocked(request).mockReturnValue(new Promise(() => undefined) as never);

    render(<ReportsPage />);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByLabelText("Loading reports")).not.toBeInTheDocument();
  });

  it("says there are no open reports", async () => {
    useReportsStore.setState({ reports: [] });

    render(<ReportsPage />);

    expect(await screen.findByText("No open reports. Nice!")).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading reports")).not.toBeInTheDocument();
  });

  it("lists every report with what it is about", async () => {
    render(<ReportsPage />);

    const rows = await screen.findAllByRole("listitem");

    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent(`Wrong timestampFrieren - 4Anime TonightSuggested: ${formatTimestamp(720)} → ${formatTimestamp(1440)}“Starts too early”Mina · ${new Date(createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`);
    expect(rows[1]).toHaveTextContent(`Untracked postMystery StreamA viewer · ${new Date(createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`);
    expect(rows[1]).not.toHaveTextContent("Suggested");
    expect(rows[1]).not.toHaveTextContent("“");
    expect(rows[2]).toHaveTextContent("Missing reactionpost-3A viewer");
  });

  it("opens the post of a report on Patreon, at its reaction", async () => {
    render(<ReportsPage />);
    fireEvent.click(within((await screen.findAllByRole("listitem"))[0]!).getByRole("button", { name: /Frieren - 4/ }));

    const url = new URL(vi.mocked(window.open).mock.calls[0]![0] as string);

    expect(url.pathname).toBe("/posts/post-1");
    expect(url.searchParams.get("reactionId")).toBe("t1");
  });

  it("opens the post of a report that names no reaction", async () => {
    render(<ReportsPage />);
    fireEvent.click(within((await screen.findAllByRole("listitem"))[1]!).getByRole("button", { name: /Mystery Stream/ }));

    const url = new URL(vi.mocked(window.open).mock.calls[0]![0] as string);

    expect(url.pathname).toBe("/posts/post-2");
    expect(url.searchParams.has("reactionId")).toBe(false);
  });

  it("dismisses a report without opening its post", async () => {
    render(<ReportsPage />);
    fireEvent.click(within((await screen.findAllByRole("listitem"))[1]!).getByRole("button", { name: "dismiss report" }));

    await waitFor(() => expect(request).toHaveBeenCalledWith("reports.resolve", { reportId: "r2" }));
    expect(window.open).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the click on the dismiss button from reaching what holds the page", async () => {
    const parentClick = vi.fn();

    render(<div onClick={parentClick}><ReportsPage /></div>);
    fireEvent.click(within((await screen.findAllByRole("listitem"))[1]!).getByRole("button", { name: "dismiss report" }));

    await waitFor(() => expect(request).toHaveBeenCalledWith("reports.resolve", { reportId: "r2" }));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("shows why a report could not be dismissed", async () => {
    vi.mocked(request).mockImplementation((async (type: string) => type === "reports.resolve" ? Promise.reject(new Error("Offline")) : null) as never);

    render(<ReportsPage />);
    fireEvent.click(within((await screen.findAllByRole("listitem"))[0]!).getByRole("button", { name: "dismiss report" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("shows why the reports could not be loaded", async () => {
    vi.mocked(request).mockRejectedValue(new Error("Missing or insufficient permissions"));

    render(<ReportsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("The database refused this change. Check that you are still allowed to make it.");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
