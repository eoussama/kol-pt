import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useState } from "react";
import { describeError } from "./errors";



/**
 * @description
 * Confirm dialog props.
 */
export interface IConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;

  /**
   * @description
   * Does the confirmed action. The dialog stays open, showing the error, if it fails.
   */
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}

/**
 * @description
 * Asks before a destructive action, and runs it.
 *
 * @param props - What to ask and do
 * @returns The dialog
 */
function ConfirmDialog(props: IConfirmDialogProps): JSX.Element {
  const { open, title, message, confirmLabel, onConfirm, onClose } = props;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    }
    catch (failure) {
      setError(describeError(failure));
    }
    finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" disableElevation disabled={busy} onClick={confirm}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
