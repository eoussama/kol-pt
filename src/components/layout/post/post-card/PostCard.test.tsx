import { act, fireEvent, render, screen } from "@testing-library/react";
import { Post } from "../../../../core/domain/post";
import { Tag } from "../../../../core/domain/tag";
import { EViewMode } from "../../../../core/enums/view-mode.enum";
import { useAuthStore } from "../../../../state/auth.state";
import PostCard from "./PostCard";



/**
 * @description
 * What the stubbed layout measures: the chips row's content and visible heights.
 */
const layout = { scrollHeight: 20, clientHeight: 20 };

/**
 * @description
 * The stubbed resize observers, by creation.
 */
const observers: Array<{ callback: () => void; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];

/**
 * @description
 * Builds a reaction.
 *
 * @param id - The reaction's id and label
 * @param description - The reaction's hover text
 * @returns The reaction
 */
function tag(id: string, description = ""): Tag {
  return new Tag({ id, entryId: "e1", label: id, description, startTime: 0, endTime: 60, context: {} }, null);
}

/**
 * @description
 * Builds a post.
 *
 * @param tags - The post's reactions
 * @param description - The post's description
 * @returns The post
 */
function post(tags: Array<Tag> = [tag("Opening", "The opening scene")], description = "Reacting to the new season"): Post {
  return new Post({ id: "anime-tonight-1001", title: "Anime Tonight", description, creationDate: new Date(2025, 4, 6, 18, 30).getTime(), thumbnail: "https://cdn.test/thumb.png", tags: [] } as never, tags);
}

/**
 * @description
 * Renders a card, with a parent listening for clicks that should not reach it.
 *
 * @param card - The card's data
 * @param viewMode - How the card is shown
 * @returns The render result and the parent's click spy
 */
function renderCard(card = post(), viewMode: 0 | 1 = EViewMode.EXPANDED) {
  const parentClick = vi.fn();
  const view = render(<div onClick={parentClick}><PostCard post={card} viewMode={viewMode} /></div>);

  return { ...view, parentClick };
}

describe("postCard", () => {
  let open: ReturnType<typeof vi.spyOn>;
  const sizes = [
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(() => layout.scrollHeight),
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => layout.clientHeight),
  ];

  beforeEach(() => {
    Object.assign(layout, { scrollHeight: 20, clientHeight: 20 });
    observers.length = 0;
    vi.stubGlobal("ResizeObserver", class {
      observe = vi.fn();
      disconnect = vi.fn();

      constructor(callback: () => void) {
        observers.push({ callback, observe: this.observe, disconnect: this.disconnect });
      }
    });
    open = vi.spyOn(window, "open").mockImplementation(() => null);
    useAuthStore.setState({ user: null, moderator: false });
  });

  afterEach(() => {
    open.mockRestore();
    vi.unstubAllGlobals();
  });

  afterAll(() => {
    sizes.forEach(size => size.mockRestore());
  });

  describe("content", () => {
    it("shows the thumbnail, title, date, description and reactions", () => {
      renderCard();

      expect(screen.getByRole("img", { name: "Anime Tonight" })).toHaveAttribute("src", "https://cdn.test/thumb.png");
      expect(screen.getByRole("button", { name: "Anime Tonight" })).toBeInTheDocument();
      expect(screen.getByText(new Date(2025, 4, 6, 18, 30).toLocaleString())).toHaveAttribute("datetime", new Date(2025, 4, 6, 18, 30).toISOString());
      expect(screen.getByText("Reacting to the new season")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Opening" })).toBeInTheDocument();
    });

    it("leaves out the description when the post has none", () => {
      renderCard(post([tag("Opening")], ""));

      expect(document.querySelector("p")).toBeNull();
    });

    it("leaves out the reactions row when the post has no reactions", () => {
      renderCard(post([]));

      expect(screen.getAllByRole("button")).toHaveLength(1);
      expect(observers).toHaveLength(0);
    });

    it("explains a reaction when hovering it", async () => {
      renderCard();

      fireEvent.focus(screen.getByRole("button", { name: "Opening" }));

      expect(await screen.findByText("The opening scene")).toBeInTheDocument();
    });
  });

  describe("view mode", () => {
    it("lays an expanded card out with the description", () => {
      const { container } = renderCard(post(), EViewMode.EXPANDED);

      expect(container.querySelector("article")).toHaveAttribute("data-view-mode", "expanded");
      expect(screen.getByText("Reacting to the new season")).toBeInTheDocument();
    });

    it("hides the description of a compact card", () => {
      const { container } = renderCard(post(), EViewMode.COMPACT);

      expect(container.querySelector("article")).toHaveAttribute("data-view-mode", "compact");
      expect(screen.queryByText("Reacting to the new season")).not.toBeInTheDocument();
    });
  });

  describe("opening", () => {
    it("opens the post when its title is clicked", () => {
      renderCard();

      fireEvent.click(screen.getByRole("button", { name: "Anime Tonight" }));

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/posts\/anime-tonight-1001$/), "_blank", "noopener,noreferrer");
    });

    it("opens the post at a reaction when its chip is clicked, without triggering the card", () => {
      const { parentClick } = renderCard(post([tag("Opening"), tag("Finale")]));

      fireEvent.click(screen.getByRole("button", { name: "Finale" }));

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/posts\/anime-tonight-1001\?reactionId=Finale$/), "_blank", "noopener,noreferrer");
      expect(parentClick).not.toHaveBeenCalled();
    });

    it("prevents the browser's default action on a chip click", () => {
      renderCard();

      const notPrevented = fireEvent.click(screen.getByRole("button", { name: "Opening" }));

      expect(notPrevented).toBe(false);
    });
  });

  describe("reactions overflow", () => {
    it("offers no toggle while all the reactions fit on one row", () => {
      renderCard();

      expect(screen.queryByRole("button", { name: /Show (more|less)/ })).not.toBeInTheDocument();
    });

    it("treats a single pixel of overflow as a fit", () => {
      Object.assign(layout, { scrollHeight: 21, clientHeight: 20 });
      renderCard();

      expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
    });

    it("offers to show more when the reactions wrap, and shows all of them", () => {
      Object.assign(layout, { scrollHeight: 44, clientHeight: 20 });
      renderCard();

      const toggle = screen.getByRole("button", { name: "Show more" });
      const chips = screen.getByRole("button", { name: "Opening" }).parentElement!;

      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(chips).toHaveClass("max-h-5", "overflow-hidden");

      fireEvent.click(toggle);

      expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
      expect(chips).not.toHaveClass("max-h-5");
      expect(chips).not.toHaveClass("overflow-hidden");
    });

    it("collapses the reactions again", () => {
      Object.assign(layout, { scrollHeight: 44, clientHeight: 20 });
      renderCard();

      fireEvent.click(screen.getByRole("button", { name: "Show more" }));
      fireEvent.click(screen.getByRole("button", { name: "Show less" }));

      expect(screen.getByRole("button", { name: "Show more" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Opening" }).parentElement).toHaveClass("max-h-5");
    });

    it("keeps the toggle while open, as the reactions then always fit", () => {
      Object.assign(layout, { scrollHeight: 44, clientHeight: 20 });
      renderCard();
      fireEvent.click(screen.getByRole("button", { name: "Show more" }));

      Object.assign(layout, { scrollHeight: 44, clientHeight: 44 });
      act(() => observers.forEach(observer => observer.callback()));

      expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
    });

    it("measures again when the card is resized", () => {
      Object.assign(layout, { scrollHeight: 44, clientHeight: 20 });
      renderCard();

      expect(screen.getByRole("button", { name: "Show more" })).toBeInTheDocument();

      Object.assign(layout, { scrollHeight: 20, clientHeight: 20 });
      act(() => observers.forEach(observer => observer.callback()));

      expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
    });

    it("observes the reactions row, and stops when unmounted", () => {
      const { unmount } = renderCard();

      expect(observers).toHaveLength(1);
      expect(observers[0]!.observe).toHaveBeenCalledWith(screen.getByRole("button", { name: "Opening" }).parentElement);
      expect(observers[0]!.disconnect).not.toHaveBeenCalled();

      unmount();

      expect(observers[0]!.disconnect).toHaveBeenCalledTimes(1);
    });

    it("measures again when reactions are added", () => {
      const view = renderCard();

      Object.assign(layout, { scrollHeight: 44, clientHeight: 20 });
      view.rerender(<div><PostCard post={post([tag("Opening"), tag("Finale")])} viewMode={EViewMode.EXPANDED} /></div>);

      expect(screen.getByRole("button", { name: "Show more" })).toBeInTheDocument();
    });

    it("does not measure a compact card, which scrolls its reactions sideways", () => {
      Object.assign(layout, { scrollHeight: 44, clientHeight: 20 });
      renderCard(post(), EViewMode.COMPACT);

      expect(observers).toHaveLength(0);
      expect(screen.queryByRole("button", { name: /Show (more|less)/ })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Opening" }).parentElement).toHaveClass("overflow-x-auto");
    });
  });

  describe("moderation", () => {
    it("has no moderation menu for viewers", () => {
      renderCard();

      expect(screen.queryByRole("button", { name: "moderate" })).not.toBeInTheDocument();
    });

    it("gives moderators the post's menu, listing its reactions to edit", () => {
      useAuthStore.setState({ moderator: true });
      renderCard();

      fireEvent.click(screen.getByRole("button", { name: "moderate" }));

      expect(screen.getByRole("menuitem", { name: "Add a reaction" })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Edit a reaction" })).toBeInTheDocument();
    });

    it("opens the post's details from the menu", async () => {
      useAuthStore.setState({ moderator: true });
      renderCard();

      fireEvent.click(screen.getByRole("button", { name: "moderate" }));
      fireEvent.click(screen.getByRole("menuitem", { name: "Edit post details" }));

      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("sits in the corner of the card, closer to the edge when compact", () => {
      useAuthStore.setState({ moderator: true });

      const expanded = renderCard(post(), EViewMode.EXPANDED);

      expect(screen.getByRole("button", { name: "moderate" }).closest("div.absolute")).toHaveClass("top-2", "right-2");
      expect(screen.getByRole("button", { name: "moderate" })).toHaveClass("rounded-full");
      expanded.unmount();

      renderCard(post(), EViewMode.COMPACT);

      expect(screen.getByRole("button", { name: "moderate" }).closest("div.absolute")).toHaveClass("top-1.5", "right-1.5");
      expect(screen.getByRole("button", { name: "moderate" })).not.toHaveClass("rounded-full");
    });

    it("leaves room for the menu beside a compact title, for moderators only", () => {
      const viewer = renderCard(post(), EViewMode.COMPACT);

      expect(screen.getByRole("button", { name: "Anime Tonight" })).not.toHaveClass("pr-8");
      viewer.unmount();

      useAuthStore.setState({ moderator: true });
      const moderator = renderCard(post(), EViewMode.COMPACT);

      expect(screen.getByRole("button", { name: "Anime Tonight" })).toHaveClass("pr-8");
      moderator.unmount();

      renderCard(post(), EViewMode.EXPANDED);

      expect(screen.getByRole("button", { name: "Anime Tonight" })).not.toHaveClass("pr-8");
    });
  });
});
