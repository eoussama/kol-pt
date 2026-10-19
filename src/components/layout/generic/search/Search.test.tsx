import { fireEvent, render, screen } from "@testing-library/react";
import Search from "./Search";



describe("search", () => {
  it("falls back to a default placeholder and label", () => {
    render(<Search onSearch={vi.fn()} />);

    const input = screen.getByRole("searchbox", { name: "Search" });

    expect(input).toHaveAttribute("placeholder", "Search...");
  });

  it("uses the given placeholder as both its placeholder and label", () => {
    render(<Search placeholder="Find posts" onSearch={vi.fn()} />);

    expect(screen.getByRole("searchbox", { name: "Find posts" })).toHaveAttribute("placeholder", "Find posts");
  });

  it("reports what the user types", () => {
    const onSearch = vi.fn();

    render(<Search onSearch={onSearch} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "severance" } });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch.mock.calls[0]![0].target.value).toBe("severance");
  });

  it("shows the count, even when it is zero, and no count otherwise", () => {
    const { rerender } = render(<Search count={0} onSearch={vi.fn()} />);

    expect(screen.getByText("0")).toBeInTheDocument();

    rerender(<Search count={12} countLabel="posts" onSearch={vi.fn()} />);
    expect(screen.getByText("12")).toBeInTheDocument();

    rerender(<Search onSearch={vi.fn()} />);
    expect(screen.queryByText("12")).not.toBeInTheDocument();
  });

  it("has no count badge without a count", () => {
    const { container } = render(<Search onSearch={vi.fn()} />);

    expect(container.querySelectorAll("[data-slot=input-group-addon]")).toHaveLength(1);
  });

  it("explains the count when hovering it", async () => {
    render(<Search count={3} countLabel="posts listed" onSearch={vi.fn()} />);

    expect(screen.queryByText("posts listed")).not.toBeInTheDocument();

    fireEvent.focus(screen.getByText("3"));

    expect(await screen.findByText("posts listed")).toBeInTheDocument();
  });

  it("renders the actions next to the input", () => {
    const { container, rerender } = render(<Search onSearch={vi.fn()} />);
    const root = container.firstElementChild as HTMLElement;

    expect(screen.queryByRole("button", { name: "Filter" })).not.toBeInTheDocument();
    expect(root.children).toHaveLength(1);

    rerender(<Search actions={<button type="button">Filter</button>} onSearch={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
    expect(root.children).toHaveLength(2);
    expect(root.children[1]).toContainElement(screen.getByRole("button", { name: "Filter" }));
    expect(root.children[1]).not.toBe(screen.getByRole("button", { name: "Filter" }));
  });
});
