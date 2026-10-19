import { render, screen } from "@testing-library/react";
import { useContext } from "react";
import { Post } from "../core/domain/post";
import { PostContext, PostProvider } from "./PostContext";



/**
 * @description
 * Builds a post with the given title.
 *
 * @param title - The post's title
 * @returns The post
 */
function postTitled(title: string): Post {
  return new Post({ id: "p1", title, description: "", creationDate: 0, thumbnail: "", tags: [] }, []);
}

/**
 * @description
 * Shows the title of the post in the context.
 *
 * @returns The title
 */
function Title(): JSX.Element {
  const { post } = useContext(PostContext);

  return <p>{post.title}</p>;
}

describe("postProvider", () => {
  it("shares its post with its children", () => {
    render(<PostProvider post={postTitled("Anime Tonight")}><Title /></PostProvider>);

    expect(screen.getByText("Anime Tonight")).toBeInTheDocument();
  });

  it("follows the post it is given", () => {
    const { rerender } = render(<PostProvider post={postTitled("Anime Tonight")}><Title /></PostProvider>);

    rerender(<PostProvider post={postTitled("Movie Night")}><Title /></PostProvider>);

    expect(screen.getByText("Movie Night")).toBeInTheDocument();
    expect(screen.queryByText("Anime Tonight")).not.toBeInTheDocument();
  });
});
