import { render, screen } from "@testing-library/react";
import PostLoader from "./PostLoader";



describe("postLoader", () => {
  it("announces that the post is loading", () => {
    render(<PostLoader />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading post info...");
  });

  it("draws the header and two reaction rows as placeholders", () => {
    const { container } = render(<PostLoader />);

    expect(container.querySelectorAll("[data-slot='skeleton']")).toHaveLength(8);
  });
});
