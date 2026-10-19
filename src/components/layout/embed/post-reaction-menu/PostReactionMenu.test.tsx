import { fireEvent, render, screen, within } from "@testing-library/react";
import { ModerationContext } from "../../../../context/ModerationContext";
import { createEntry } from "../../../../core/domain/hydrate";
import { Tag } from "../../../../core/domain/tag";
import { EEntryType } from "../../../../core/enums/entry-type.enum";
import { useAuthStore } from "../../../../state/auth.state";
import PostReactionMenu from "./PostReactionMenu";



const user = { uid: "u1", email: null, displayName: null, photoURL: null };
const actions = { report: vi.fn(), editTag: vi.fn(), deleteTag: vi.fn(), editPost: vi.fn(), untrackPost: vi.fn(), review: vi.fn() };
const anime = createEntry({ id: "e1", type: EEntryType.ANIME, title: "Frieren", malId: 52991, anilistId: -1, kitsuId: "" } as never);
const channel = createEntry({ id: "e2", type: EEntryType.YOUTUBE, title: "Some Channel", handle: "somechannel" } as never);

/**
 * @description
 * Builds a reaction.
 *
 * @param entry - What the reaction is about
 * @param context - The reaction's extra data
 * @returns The reaction
 */
function tag(entry: typeof anime | null = null, context: Record<string, unknown> = {}): Tag {
  return new Tag({ id: "t1", entryId: "e1", label: "3", description: "", startTime: 0, endTime: 60, context }, entry);
}

/**
 * @description
 * Renders the menu and opens it.
 *
 * @param reaction - The reaction the menu is for
 * @returns The render result
 */
function openMenu(reaction: Tag) {
  const view = render(
    <ModerationContext.Provider value={actions}>
      <PostReactionMenu tag={reaction} />
    </ModerationContext.Provider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "more" }));

  return view;
}

/**
 * @description
 * The labels of the opened menu's items.
 *
 * @returns The labels, in order
 */
function items(): Array<string> {
  return screen.getAllByRole("menuitem").map(item => item.textContent ?? "");
}

describe("postReactionMenu", () => {
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.values(actions).forEach(action => action.mockClear());
    open = vi.spyOn(window, "open").mockImplementation(() => null);
    useAuthStore.setState({ user: null, moderator: false });
  });

  afterEach(() => {
    open.mockRestore();
  });

  describe("links", () => {
    it("lists the links the entry has, and opens one", () => {
      openMenu(tag(anime));

      expect(items()).toEqual(["View on MyAnimeList"]);

      fireEvent.click(screen.getByRole("menuitem", { name: /View on MyAnimeList/ }));

      expect(open).toHaveBeenCalledWith("https://myanimelist.net/anime/52991", "_blank", "noopener,noreferrer");
    });

    it("shows each link with its icon", () => {
      openMenu(tag(anime));

      expect(within(screen.getByRole("menuitem", { name: /View on MyAnimeList/ })).getByRole("img", { name: "MAL icon" })).toBeInTheDocument();
    });

    it("offers a YouTube video's link only when the reaction names the video", () => {
      const { unmount } = openMenu(tag(channel, { videoId: "dQw4w9WgXcQ" }));

      expect(items()).toEqual(["Watch on YouTube", "View Some Channel Channel"]);

      fireEvent.click(screen.getByRole("menuitem", { name: /Watch on YouTube/ }));
      expect(open).toHaveBeenCalledWith("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank", "noopener,noreferrer");
      unmount();

      openMenu(tag(channel));

      expect(items()).toEqual(["View Some Channel Channel"]);
    });

    it("separates a link from the next when the link asks for it", () => {
      openMenu(tag(channel, { videoId: "dQw4w9WgXcQ" }));

      expect(screen.getAllByRole("separator")).toHaveLength(1);
    });
  });

  describe("actions", () => {
    it("has none for signed-out viewers", () => {
      openMenu(tag(anime));

      expect(items()).toEqual(["View on MyAnimeList"]);
      expect(screen.queryByRole("separator")).not.toBeInTheDocument();
      expect(screen.getAllByRole("group")).toHaveLength(1);
    });

    it("lets signed-in viewers report a problem, and nothing more", () => {
      const reaction = tag(anime);

      useAuthStore.setState({ user });
      openMenu(reaction);

      expect(items()).toEqual(["View on MyAnimeList", "Report a problem"]);

      fireEvent.click(screen.getByRole("menuitem", { name: "Report a problem" }));

      expect(actions.report).toHaveBeenCalledWith("timestamp", reaction);
    });

    it("separates the links from the actions", () => {
      useAuthStore.setState({ user });
      openMenu(tag(anime));

      expect(screen.getAllByRole("separator")).toHaveLength(1);
    });

    it("shows only the actions for a reaction without links", () => {
      useAuthStore.setState({ user });
      openMenu(tag());

      expect(items()).toEqual(["Report a problem"]);
      expect(screen.queryByRole("separator")).not.toBeInTheDocument();
      expect(screen.getAllByRole("group")).toHaveLength(1);
    });

    it("lets moderators edit and delete the reaction", () => {
      const reaction = tag();

      useAuthStore.setState({ user, moderator: true });
      const { unmount } = openMenu(reaction);

      expect(items()).toEqual(["Report a problem", "Edit reaction", "Delete reaction"]);

      fireEvent.click(screen.getByRole("menuitem", { name: "Edit reaction" }));
      expect(actions.editTag).toHaveBeenCalledWith(reaction);
      unmount();

      openMenu(reaction);
      fireEvent.click(screen.getByRole("menuitem", { name: "Delete reaction" }));

      expect(actions.deleteTag).toHaveBeenCalledWith(reaction);
      expect(actions.report).not.toHaveBeenCalled();
    });

    it("marks deleting as destructive", () => {
      useAuthStore.setState({ user, moderator: true });
      openMenu(tag());

      expect(screen.getByRole("menuitem", { name: "Delete reaction" })).toHaveAttribute("data-variant", "destructive");
      expect(screen.getByRole("menuitem", { name: "Edit reaction" })).toHaveAttribute("data-variant", "default");
    });

    it("gives moderators nothing without a signed-in user", () => {
      useAuthStore.setState({ user: null, moderator: true });
      openMenu(tag(anime));

      expect(items()).toEqual(["View on MyAnimeList"]);
    });
  });
});
