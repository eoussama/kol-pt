import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ConfirmDialog from "./ConfirmDialog";



/**
 * @description
 * Renders an open confirm dialog.
 *
 * @param props - What to override
 * @param props.onConfirm - The confirmed action
 * @param props.onClose - Called when the dialog closes
 * @param props.open - Whether the dialog is open
 */
function renderDialog(props: { onConfirm?: () => Promise<unknown>; onClose?: () => void; open?: boolean } = {}): void {
  render(
    <ConfirmDialog
      open={props.open ?? true}
      title="Delete this reaction?"
      message="It cannot be undone."
      confirmLabel="Delete"
      onConfirm={props.onConfirm ?? (async () => undefined)}
      onClose={props.onClose ?? vi.fn()}
    />,
  );
}

describe("confirmDialog", () => {
  it("asks with its title, message and label", () => {
    renderDialog();

    expect(screen.getByRole("alertdialog", { name: "Delete this reaction?" })).toHaveTextContent("It cannot be undone.");
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("shows nothing while closed", () => {
    renderDialog({ open: false });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("runs the action, then closes", async () => {
    const calls: Array<string> = [];

    renderDialog({ onConfirm: async () => calls.push("confirm"), onClose: () => calls.push("close") });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(calls).toEqual(["confirm", "close"]));
  });

  it("is busy while the action runs", async () => {
    let finish: () => void = () => undefined;

    renderDialog({ onConfirm: () => new Promise<void>((resolve) => {
      finish = resolve;
    }) });
    expect(screen.getByRole("button", { name: "Delete" }).querySelector("[data-icon=inline-start]")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled());
    expect(screen.getByRole("button", { name: "Delete" }).querySelector("[data-icon=inline-start]")).not.toBeNull();

    finish();

    await waitFor(() => expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled());
    expect(screen.getByRole("button", { name: "Delete" }).querySelector("[data-icon=inline-start]")).toBeNull();
  });

  it("stays open with the error when the action fails, and can be retried", async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(undefined);

    renderDialog({ onConfirm, onClose });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("closes without running the action when cancelled", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    renderDialog({ onConfirm, onClose });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("closes without running the action when dismissed", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    renderDialog({ onConfirm, onClose });
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
