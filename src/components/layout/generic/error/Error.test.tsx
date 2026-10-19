import { render, screen } from "@testing-library/react";
import Error from "./Error";



describe("error", () => {
  it("renders the message as an alert in place of the children when there is an error", () => {
    render(<Error error={true} message="Could not load"><p>Content</p></Error>);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not load");
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders the children when there is no error", () => {
    render(<Error error={false} message="Could not load"><p>Content</p></Error>);

    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders nothing when there is no error and no children", () => {
    const { container } = render(<Error error={false} message="Could not load" />);

    expect(container).toBeEmptyDOMElement();
  });
});
