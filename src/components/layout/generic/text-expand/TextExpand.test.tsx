import { fireEvent, render, screen } from "@testing-library/react";
import TextExpand from "./TextExpand";



describe("textExpand", () => {
  it("toggles between a preview and the full text", () => {
    const content = "a".repeat(250);

    const { container } = render(<TextExpand content={content} />);

    expect(container).toHaveTextContent(`${"a".repeat(200)}...read more`);
    expect(container).not.toHaveTextContent(content);

    fireEvent.click(screen.getByText("read more"));

    expect(screen.getByText("read less")).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();

    fireEvent.click(screen.getByText("read less"));

    expect(container).toHaveTextContent(`${"a".repeat(200)}...read more`);
  });

  it("previews up to the given length", () => {
    const { container } = render(<TextExpand content="abcdefghij" minLength={4} />);

    expect(container).toHaveTextContent("abcd...read more");
  });

  it("shows text as long as the preview in full, without a toggle", () => {
    const { container } = render(<TextExpand content={"a".repeat(200)} />);

    expect(container.textContent).toBe("a".repeat(200));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers a toggle for text one character longer than the preview", () => {
    const { container } = render(<TextExpand content={"a".repeat(201)} />);

    expect(container.textContent).toBe(`${"a".repeat(200)}...read more`);
  });

  it("does not offer a toggle for short text", () => {
    render(<TextExpand content="short" />);

    expect(screen.queryByText(/read (more|less)/)).not.toBeInTheDocument();
  });
});
