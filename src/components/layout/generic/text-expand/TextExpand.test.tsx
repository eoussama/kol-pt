import { fireEvent, render, screen } from "@testing-library/react";
import TextExpand from "./TextExpand";



describe("textExpand", () => {
  it("toggles between a preview and the full text", () => {
    const content = "a".repeat(250);

    render(<TextExpand content={content} />);

    fireEvent.click(screen.getByText("read more"));

    expect(screen.getByText("read less")).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it("does not offer a toggle for short text", () => {
    render(<TextExpand content="short" />);

    expect(screen.queryByText(/read (more|less)/)).not.toBeInTheDocument();
  });
});
