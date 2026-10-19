import type { TReport } from "../core/schemas/moderation.schema";

import { renderHook, waitFor } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { reportsItem } from "../core/storage/items";
import { useAuthStore } from "../state/auth.state";
import { useReportsStore } from "../state/reports.state";
import { useReportsSync } from "./reports-sync.hook";



const report: TReport = { id: "r1", kind: "missing", postId: "p1", postTitle: "", note: "", reporterUid: "u2", reporterName: "", createdAt: 1 };
const other: TReport = { ...report, id: "r2" };
const user = { uid: "u1", email: null, displayName: null, photoURL: null };

/**
 * @description
 * Lets pending storage events settle.
 *
 * @returns A promise resolving once they have
 */
const settle = () => new Promise(resolve => setTimeout(resolve, 20));

describe("useReportsSync", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
    useAuthStore.setState({ user, moderator: true });
    useReportsStore.setState({ reports: [] });
    await reportsItem.removeValue();
  });

  it("loads the reports kept in storage for the moderator", async () => {
    await reportsItem.setValue({ uid: "u1", reports: [report] });

    renderHook(() => useReportsSync());

    await waitFor(() => expect(useReportsStore.getState().reports).toEqual([report]));
  });

  it("ignores reports kept for someone else", async () => {
    await reportsItem.setValue({ uid: "u2", reports: [report] });

    renderHook(() => useReportsSync());
    await settle();

    expect(useReportsStore.getState().reports).toEqual([]);
  });

  it("has no reports when storage has none", async () => {
    useReportsStore.setState({ reports: [report] });

    renderHook(() => useReportsSync());

    await waitFor(() => expect(useReportsStore.getState().reports).toEqual([]));
  });

  it("follows the reports as storage changes, closing them in every tab", async () => {
    renderHook(() => useReportsSync());
    await settle();

    await reportsItem.setValue({ uid: "u1", reports: [report, other] });
    await waitFor(() => expect(useReportsStore.getState().reports).toEqual([report, other]));

    await reportsItem.setValue({ uid: "u1", reports: [other] });
    await waitFor(() => expect(useReportsStore.getState().reports).toEqual([other]));
  });

  it("clears the reports for users who are not moderators, whatever storage holds", async () => {
    useAuthStore.setState({ moderator: false });
    useReportsStore.setState({ reports: [report] });
    await reportsItem.setValue({ uid: "u1", reports: [report] });

    renderHook(() => useReportsSync());

    await waitFor(() => expect(useReportsStore.getState().reports).toEqual([]));
    await reportsItem.setValue({ uid: "u1", reports: [other] });
    await settle();
    expect(useReportsStore.getState().reports).toEqual([]);
  });

  it("clears the reports for signed-out users", async () => {
    useAuthStore.setState({ user: null });
    useReportsStore.setState({ reports: [report] });
    await reportsItem.setValue({ uid: "u1", reports: [report] });

    renderHook(() => useReportsSync());

    await waitFor(() => expect(useReportsStore.getState().reports).toEqual([]));
  });

  it("clears the reports when the moderator signs out", async () => {
    await reportsItem.setValue({ uid: "u1", reports: [report] });
    renderHook(() => useReportsSync());
    await waitFor(() => expect(useReportsStore.getState().reports).toEqual([report]));

    useAuthStore.setState({ user: null });

    await waitFor(() => expect(useReportsStore.getState().reports).toEqual([]));
  });

  it("ignores the stored reports once unmounted", async () => {
    let resolve: (value: { uid: string; reports: Array<TReport> }) => void = () => undefined;
    const read = new Promise<{ uid: string; reports: Array<TReport> }>((r) => {
      resolve = r;
    });

    vi.spyOn(reportsItem, "getValue").mockReturnValue(read);

    const { unmount } = renderHook(() => useReportsSync());

    unmount();
    resolve({ uid: "u1", reports: [report] });
    await read;

    expect(useReportsStore.getState().reports).toEqual([]);
  });

  it("stops following storage once unmounted", async () => {
    const { unmount } = renderHook(() => useReportsSync());

    await settle();
    unmount();
    await reportsItem.setValue({ uid: "u1", reports: [report] });
    await settle();

    expect(useReportsStore.getState().reports).toEqual([]);
  });

  it("keeps the reports it has when storage cannot be read", async () => {
    useReportsStore.setState({ reports: [report] });
    vi.spyOn(reportsItem, "getValue").mockRejectedValue(new Error("unreadable"));

    renderHook(() => useReportsSync());
    await settle();

    expect(useReportsStore.getState().reports).toEqual([report]);
  });
});
