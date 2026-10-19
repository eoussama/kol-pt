import { fireEvent, render, screen } from "@testing-library/react";
import { useContext } from "react";
import { Tag } from "../core/domain/tag";
import { ReactionOverlayContext, ReactionOverlayProvider } from "./ReactionOverlayContext";



const tag = new Tag({ id: "t1", entryId: "e1", label: "Ep 4", description: "", startTime: 60, endTime: 120, context: {} }, null);

/**
 * @description
 * Shows the overlay's state, and buttons to change it.
 *
 * @returns The state and the buttons
 */
function Overlay(): JSX.Element {
  const { tag: selected, dialogOpened, setTag, setDialogOpened } = useContext(ReactionOverlayContext);

  return (
    <>
      <p>{`tag: ${selected?.id ?? "none"}`}</p>
      <p>{`dialog: ${dialogOpened ? "opened" : "closed"}`}</p>
      <button type="button" onClick={() => setTag(tag)}>select</button>
      <button type="button" onClick={() => setDialogOpened(true)}>open</button>
    </>
  );
}

describe("reactionOverlayProvider", () => {
  it("starts closed, with no reaction", () => {
    render(<ReactionOverlayProvider><Overlay /></ReactionOverlayProvider>);

    expect(screen.getByText("tag: none")).toBeInTheDocument();
    expect(screen.getByText("dialog: closed")).toBeInTheDocument();
  });

  it("shares the selected reaction and the dialog's state with its children", () => {
    render(<ReactionOverlayProvider><Overlay /></ReactionOverlayProvider>);

    fireEvent.click(screen.getByRole("button", { name: "select" }));
    fireEvent.click(screen.getByRole("button", { name: "open" }));

    expect(screen.getByText("tag: t1")).toBeInTheDocument();
    expect(screen.getByText("dialog: opened")).toBeInTheDocument();
  });
});
