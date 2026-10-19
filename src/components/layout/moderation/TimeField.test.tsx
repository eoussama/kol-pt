import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import TimeField from "./TimeField";



const player = vi.hoisted(() => ({ ready: true, currentTime: 754.6 }));

vi.mock("../../../content/player/PlayerProvider", () => ({ usePlayer: () => player }));

/**
 * @description
 * Holds the field's value like a form would, and shows it.
 *
 * @param props - The field's props
 * @param props.initial - The value to start with
 * @param props.required - Whether the field is required
 * @param props.error - A problem to show
 * @returns The field and the value
 */
function Form(props: { initial: number | null; required?: boolean; error?: string }): JSX.Element {
  const [value, setValue] = useState<number | null>(props.initial);

  return (
    <>
      <TimeField label="Starts at" value={value} required={props.required} error={props.error} onChange={setValue} />
      <button type="button" onClick={() => setValue(90)}>suggest</button>
      <p data-testid="value">{String(value)}</p>
    </>
  );
}

describe("timeField", () => {
  beforeEach(() => {
    player.ready = true;
    player.currentTime = 754.6;
  });

  it("starts with the value formatted as h:mm:ss", () => {
    render(<Form initial={3725} />);

    expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("1:02:05");
  });

  it("starts empty without a value", () => {
    render(<Form initial={null} />);

    expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("");
  });

  it("reports the seconds typed, and null while it is unreadable", () => {
    render(<Form initial={null} />);

    const input = screen.getByRole("textbox", { name: "Starts at" });

    fireEvent.change(input, { target: { value: "1:30" } });
    expect(screen.getByTestId("value")).toHaveTextContent("90");

    fireEvent.change(input, { target: { value: "1:3x" } });
    expect(screen.getByTestId("value")).toHaveTextContent("null");
    expect(input).toHaveValue("1:3x");
  });

  it("explains an unreadable time under the field", () => {
    render(<Form initial={null} error="Ignored while the text is unreadable" />);

    const input = screen.getByRole("textbox", { name: "Starts at" });

    fireEvent.change(input, { target: { value: "soon" } });

    expect(screen.getByRole("alert")).toHaveTextContent("Use h:mm:ss");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("does not complain about a blank field", () => {
    render(<Form initial={null} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Starts at" }), { target: { value: "   " } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveAttribute("aria-invalid", "false");
  });

  it("shows the problem it is given", () => {
    render(<Form initial={10} error="Must be after the start" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Must be after the start");
    expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveAttribute("aria-invalid", "true");
  });

  it("marks a required field", () => {
    const { container } = render(<Form initial={null} required />);

    expect(screen.getByRole("textbox", { name: "Starts at" })).toBeRequired();
    expect(container.querySelector("label span[aria-hidden]")).toHaveTextContent("*");
  });

  it("is optional by default", () => {
    const { container } = render(<Form initial={null} />);

    expect(screen.getByRole("textbox", { name: "Starts at" })).not.toBeRequired();
    expect(container.querySelector("label span[aria-hidden]")).toBeNull();
  });

  it("takes the video's current time, without its fraction", () => {
    render(<Form initial={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Set starts at from the video" }));

    expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("0:12:34");
    expect(screen.getByTestId("value")).toHaveTextContent("754");
  });

  it("cannot take the time while the video is not ready", () => {
    player.ready = false;
    render(<Form initial={null} />);

    expect(screen.getByRole("button", { name: "Set starts at from the video" })).toBeDisabled();
  });

  it("follows a value set from outside", () => {
    render(<Form initial={null} />);

    fireEvent.click(screen.getByRole("button", { name: "suggest" }));

    expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("0:01:30");
  });

  it("keeps what was typed while it reads as the same time", () => {
    render(<Form initial={null} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Starts at" }), { target: { value: "90" } });

    expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("90");
  });

  it("clears when the value is cleared from outside", () => {
    const { rerender } = render(<TimeField label="Ends at" value={30} onChange={vi.fn()} />);

    rerender(<TimeField label="Ends at" value={null} onChange={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "Ends at" })).toHaveValue("");
  });
});
