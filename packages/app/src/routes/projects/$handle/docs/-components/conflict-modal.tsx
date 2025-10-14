import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConflictModalProps = {
  open: boolean;
  onReload: () => void;
  onDismiss: () => void;
};

export function ConflictModal({ open, onReload, onDismiss }: ConflictModalProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onDismiss();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Someone else saved a newer version</AlertDialogTitle>
          <AlertDialogDescription>
            Another tab or device saved changes after you started editing. Reload to pull the latest
            content—reloading will discard any unsaved edits you have locally, preventing an
            accidental overwrite.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              onDismiss();
            }}
          >
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onReload();
            }}
          >
            Reload page
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
