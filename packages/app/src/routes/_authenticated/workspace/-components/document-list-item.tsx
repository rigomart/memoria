import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { FileText, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type DocumentListItemProps = {
  document: Doc<"documents">;
  onDelete: (documentId: Id<"documents">) => void;
  isDeleting: boolean;
};

export function DocumentListItem({ document, onDelete, isDeleting }: DocumentListItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const handle = `${document.slug}-${document.suffix}`;

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    onDelete(document._id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="group relative rounded-lg border border-border/60 bg-background/70 p-4 transition-all hover:border-primary/40 hover:bg-background/90">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link
            to="/workspace/$docHandle"
            params={{ docHandle: handle }}
            className="group/document block"
          >
            <h3 className="font-medium text-foreground group-hover/document:text-primary transition-colors line-clamp-1">
              {document.title || "Untitled Document"}
            </h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="size-3" />
                {Math.round(document.sizeBytes / 1024)} KB
              </span>
              <span>Updated {format(new Date(document.updated), "MMM d, yyyy")}</span>
            </div>
          </Link>

          {document.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {document.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/80 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  <Tag className="size-2.5" />
                  {tag}
                </span>
              ))}
              {document.tags.length > 3 && (
                <span className="inline-flex items-center rounded-full border border-border/50 bg-background/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  +{document.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Delete {document.title}</span>
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.title || "Untitled Document"}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
