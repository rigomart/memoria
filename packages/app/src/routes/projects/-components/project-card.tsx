import { FolderIcon, Trash2Icon } from "lucide-react";
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
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

type Project = Doc<"projects">;

type ProjectCardProps = {
  project: Project;
  onOpen: (project: Project) => void;
  onDelete: (projectId: Id<"projects">) => Promise<void> | void;
  isDeleting?: boolean;
};

function formatDate(timestamp: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleDateString();
  }
}

export function ProjectCard({ project, onOpen, onDelete, isDeleting }: ProjectCardProps) {
  return (
    <div className="group relative flex flex-col justify-between gap-4 rounded-lg border bg-card p-5 transition hover:border-primary/60 hover:shadow-md">
      <button
        type="button"
        onClick={() => {
          onOpen(project);
        }}
        className="flex flex-1 flex-col items-start gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderIcon className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Handle</p>
            <p className="text-sm font-mono text-muted-foreground/90">{project.handle}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Created {formatDate(project.createdAt)}</p>
      </button>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground/80">Immutable handle</span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation();
              }}
              disabled={isDeleting}
              aria-label={`Delete project ${project.name}`}
            >
              <Trash2Icon className="size-4" aria-hidden />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{`Delete project "${project.name}"?`}</AlertDialogTitle>
              <AlertDialogDescription>
                All documents within this project will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={() => {
                  void onDelete(project._id);
                }}
              >
                Delete project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
