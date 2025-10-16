import { FileTextIcon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Doc, Id } from "../../../../../../convex/_generated/dataModel";

type Document = Doc<"documents">;

type DocumentListItemProps = {
  document: Document;
  onOpen: (documentId: Id<"documents">) => void;
  onDelete: (documentId: Id<"documents">) => Promise<void> | void;
  isDeleting?: boolean;
};

function formatDate(timestamp: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

export function DocumentListItem({
  document,
  onOpen,
  onDelete,
  isDeleting,
}: DocumentListItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
      <button
        type="button"
        className="flex flex-1 items-center gap-4 text-left"
        onClick={() => {
          onOpen(document._id);
        }}
      >
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileTextIcon className="size-5" aria-hidden />
        </span>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">{document.title}</p>
          <p className="text-xs text-muted-foreground">
            Updated {formatDate(document.updated)} · {document.status}
          </p>
          {document.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {document.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              event.stopPropagation();
            }}
            disabled={isDeleting}
            aria-label={`Delete document ${document.title}`}
          >
            <Trash2Icon className="size-4 text-destructive" aria-hidden />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Delete document "${document.title}"?`}</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                void onDelete(document._id);
              }}
            >
              Delete document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
