import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";



/**
 * @description
 * A child that throws while rendering.
 *
 * @param props - What to throw
 * @param props.message - The error's message
 */
function Broken(props: { message: string }): never {
  throw new Error(props.message);
}

describe("errorBoundary", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("renders its children while they do not throw", () => {
    render(<ErrorBoundary fallback={<p>Fallback</p>}><p>Child</p></ErrorBoundary>);

    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("renders the fallback and reports the error when a child throws", () => {
    render(<ErrorBoundary fallback={<p>Fallback</p>}><Broken message="boom" /></ErrorBoundary>);

    expect(screen.getByText("Fallback")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("[KOL PT]", expect.objectContaining({ message: "boom" }), expect.stringContaining("Broken"));
  });

  it("renders nothing when a child throws and there is no fallback", () => {
    const { container } = render(<ErrorBoundary><Broken message="boom" /></ErrorBoundary>);

    expect(container).toBeEmptyDOMElement();
  });

  it("does not report an error caused by a reloaded extension", () => {
    const { container } = render(<ErrorBoundary><Broken message="Extension context invalidated." /></ErrorBoundary>);

    expect(container).toBeEmptyDOMElement();
    expect(consoleError.mock.calls.filter((call: Array<unknown>) => call[0] === "[KOL PT]")).toHaveLength(0);
  });
});
