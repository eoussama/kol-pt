import { render, screen } from "@testing-library/react";
import Empty from "./Empty";



describe("empty", () => {
  it("renders its children when there are some", () => {
    render(
      <Empty message="Nothing here">
        <p>First</p>
        <p>Second</p>
      </Empty>,
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
  });

  it("shows the message in place of an empty list", () => {
    render(<Empty message="Nothing here">{[]}</Empty>);

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("accepts an element as the message", () => {
    render(
      <Empty message={(
        <span>
          No
          <b>results</b>
        </span>
      )}
      >
        {[]}
      </Empty>,
    );

    expect(screen.getByText("results")).toBeInTheDocument();
  });
});
