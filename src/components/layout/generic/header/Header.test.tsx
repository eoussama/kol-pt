import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { browser } from "wxt/browser";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { request } from "../../../../core/messaging/client";
import { useAuthStore } from "../../../../state/auth.state";
import { usePostStore } from "../../../../state/posts.state";
import { useReportsStore } from "../../../../state/reports.state";
import Header from "./Header";



vi.mock("../../../../core/messaging/client", () => ({ request: vi.fn(async () => undefined) }));

const user = { uid: "u1", email: "kol@example.com", displayName: null, photoURL: null };

/**
 * @description
 * Exposes the router's current path to the test.
 *
 * @returns The path, as text
 */
function Path(): JSX.Element {
  return <output aria-label="path">{useLocation().pathname}</output>;
}

/**
 * @description
 * Renders the header at a route.
 *
 * @param path - The route
 * @returns The render result
 */
function renderHeader(path = "/feed") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
      <Path />
    </MemoryRouter>,
  );
}

/**
 * @description
 * Builds an open report.
 *
 * @param id - The report's id
 * @returns The report
 */
function report(id: string) {
  return { id, kind: "missing", postId: "1001", postTitle: "", note: "", reporterUid: "u2", reporterName: "", createdAt: 1 } as const;
}

describe("header", () => {
  let open: ReturnType<typeof vi.spyOn>;
  const loadPosts = vi.fn(async () => undefined);

  beforeEach(() => {
    fakeBrowser.reset();
    vi.mocked(request).mockClear();
    loadPosts.mockClear();
    open = vi.spyOn(window, "open").mockImplementation(() => null);
    useAuthStore.setState({ user: null, moderator: false, ready: true });
    useReportsStore.setState({ reports: [] });
    usePostStore.setState({ loadPosts });
  });

  afterEach(() => {
    open.mockRestore();
  });

  describe("links", () => {
    it("shows the app's name and version, and opens the project page", () => {
      renderHeader();

      expect(screen.getByText("KOL PT")).toBeInTheDocument();
      expect(screen.getByText(`v${__APP_VERSION__}`)).toBeInTheDocument();

      fireEvent.click(screen.getByText("KOL PT"));

      expect(open).toHaveBeenCalledWith("https://github.com/EOussama/kol-pt", "_blank", "noopener,noreferrer");
    });

    it("opens the Discord server and the Patreon page", () => {
      renderHeader();

      fireEvent.click(screen.getByRole("button", { name: "Opens KOL's Discord server" }));
      expect(open).toHaveBeenLastCalledWith("https://discord.com/invite/5zGuUpwH3K", "_blank", "noopener,noreferrer");

      fireEvent.click(screen.getByRole("button", { name: "Open Patreon" }));
      expect(open).toHaveBeenLastCalledWith(expect.stringContaining("patreon.com"), "_blank", "noopener,noreferrer");
    });

    it("draws the platform logos from their bundled images", () => {
      const { container } = renderHeader();
      const icons = container.querySelectorAll<HTMLElement>("span[aria-hidden='true'][style]");

      expect(icons).toHaveLength(2);
      expect(icons[0]!.style.maskImage).toContain("discord");
      expect(icons[1]!.style.maskImage).toContain("patreon");
    });
  });

  describe("signed out", () => {
    it("offers to log in, in a window of its own", () => {
      const create = vi.spyOn(browser.windows, "create").mockResolvedValue({} as never);

      renderHeader();
      fireEvent.click(screen.getByRole("button", { name: "Login" }));

      expect(create).toHaveBeenCalledWith(expect.objectContaining({ url: browser.runtime.getURL("/auth.html" as never) }));
      expect(screen.queryByRole("button", { name: "logout" })).not.toBeInTheDocument();
    });
  });

  describe("signed in", () => {
    beforeEach(() => {
      useAuthStore.setState({ user });
    });

    it("shows the user's initial and refreshes the posts from their avatar", () => {
      renderHeader();

      expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
      expect(screen.getByText("k")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Signed in as kol@example.com, refresh posts" }));

      expect(loadPosts).toHaveBeenCalledWith(false);
    });

    it("signs out", () => {
      renderHeader();
      fireEvent.click(screen.getByRole("button", { name: "logout" }));

      expect(request).toHaveBeenCalledWith("auth.signOut", {});
    });
  });

  describe("tabs", () => {
    it("selects the tab of the current route", () => {
      renderHeader("/entries");

      expect(screen.getByRole("tab", { name: "Entries" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: "Feed" })).toHaveAttribute("aria-selected", "false");
      expect(screen.getByRole("tablist", { name: "Main navigation tabs" })).toBeInTheDocument();
    });

    it("selects the tab of a route's first segment", () => {
      renderHeader("/history/anything");

      expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute("aria-selected", "true");
    });

    it("shows no tabs at the root", () => {
      renderHeader("/");

      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("navigates when a tab is picked", () => {
      renderHeader("/feed");

      fireEvent.mouseDown(screen.getByRole("tab", { name: "History" }));
      fireEvent.click(screen.getByRole("tab", { name: "History" }));

      expect(screen.getByLabelText("path")).toHaveTextContent("/history");
      expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute("aria-selected", "true");
    });

    it("hides the tabs on other pages", () => {
      renderHeader("/entry/e1");

      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("gives only moderators the reports tab", () => {
      const { unmount } = renderHeader("/reports");

      expect(screen.queryByRole("tab", { name: /Reports/ })).not.toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Feed" })).toHaveAttribute("aria-selected", "true");
      unmount();

      useAuthStore.setState({ moderator: true });
      renderHeader("/reports");

      expect(screen.getByRole("tab", { name: "Reports" })).toHaveAttribute("aria-selected", "true");
    });

    it("counts the open reports on the reports tab, up to 99", () => {
      useAuthStore.setState({ moderator: true });
      useReportsStore.setState({ reports: [report("a"), report("b")] });

      const { unmount } = renderHeader();

      expect(screen.getByRole("tab", { name: /Reports/ }).textContent).toBe("Reports2");
      unmount();

      useReportsStore.setState({ reports: Array.from({ length: 99 }, (_, i) => report(String(i))) });
      const exact = renderHeader();

      expect(screen.getByRole("tab", { name: /Reports/ }).textContent).toBe("Reports99");
      exact.unmount();

      useReportsStore.setState({ reports: Array.from({ length: 100 }, (_, i) => report(String(i))) });
      renderHeader();

      expect(screen.getByRole("tab", { name: /Reports/ }).textContent).toBe("Reports99+");
    });

    it("shows no count without open reports", () => {
      useAuthStore.setState({ moderator: true });
      renderHeader();

      expect(screen.getByRole("tab", { name: "Reports" })).toBeInTheDocument();
    });
  });
});
