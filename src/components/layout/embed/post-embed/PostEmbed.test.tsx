import { fireEvent, render, screen } from "@testing-library/react";
import { createEntry } from "../../../../core/domain/hydrate";
import { Post } from "../../../../core/domain/post";
import { Tag } from "../../../../core/domain/tag";
import { EEntryType } from "../../../../core/enums/entry-type.enum";
import { useAuthStore } from "../../../../state/auth.state";
import { useReportsStore } from "../../../../state/reports.state";
import PostEmbed from "./PostEmbed";



const entryState = { loading: false, entry: createEntry({ id: "e1", type: EEntryType.ANIME, title: "Frieren" } as never), photo: "", description: "", subscribers: 0, genres: [], altTitles: [], reactions: [] };

vi.mock("../../../../content/player/PlayerProvider", () => ({
  usePlayer: () => ({ ready: false, playing: false, currentTime: 0, playFrom: vi.fn(), cue: vi.fn() }),
}));
vi.mock("../../../../hooks/auto-watch.hook", () => ({ useAutoWatch: () => undefined }));
vi.mock("../../../../hooks/progress.hook", () => ({ useProgressTracking: () => undefined }));
vi.mock("../../../../hooks/entry.hook", () => ({ useEntry: () => entryState }));

const user = { uid: "u1", email: null, displayName: null, photoURL: null };

/**
 * @description
 * Builds a post with one reaction about an entry.
 *
 * @returns The post
 */
function post(): Post {
  const tag = new Tag({ id: "t1", entryId: "e1", label: "3", description: "", startTime: 0, endTime: 60, context: {} }, entryState.entry);

  return new Post({ id: "anime-tonight-1001", title: "Anime Tonight", description: "", creationDate: 0, thumbnail: "", tags: [] } as never, [tag]);
}

describe("postEmbed", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, moderator: false, ready: true });
    useReportsStore.setState({ reports: [] });
  });

  it("shows the reactions of the post", () => {
    render(<PostEmbed post={post()} />);

    expect(screen.getByRole("button", { name: "1 reaction" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Frieren");
  });

  it("opens a reaction's details in a dialog", async () => {
    render(<PostEmbed post={post()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "detail" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent("Reaction info");
    expect(screen.getByRole("heading", { name: "Frieren" })).toBeInTheDocument();
  });

  it("lets signed-in users report a reaction through the moderation dialogs", async () => {
    useAuthStore.setState({ user });
    render(<PostEmbed post={post()} />);

    fireEvent.click(screen.getByRole("button", { name: "more" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Report a problem" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent(/report/i);
  });

  it("follows the post it is given", () => {
    const { rerender } = render(<PostEmbed post={post()} />);
    const other = new Post({ id: "other-2002", title: "Other", description: "", creationDate: 0, thumbnail: "", tags: [] } as never, []);

    rerender(<PostEmbed post={other} />);

    expect(screen.getByRole("button", { name: "0 reactions" })).toBeInTheDocument();
  });
});
