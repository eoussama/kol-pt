import { CircleAlert, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "../../ui/alert";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "../../ui/alert-dialog";
import { Button } from "../../ui/button";
import { Spinner } from "../../ui/spinner";
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
    <AlertDialog open={open} onOpenChange={next => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={busy} onClick={confirm}>
            {busy && <Spinner data-icon="inline-start" aria-hidden />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;
