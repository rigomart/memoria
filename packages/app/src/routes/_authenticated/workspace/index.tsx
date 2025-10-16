import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ValidationError } from "@/components/validation-error";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ProjectCard } from "./-components/project-card";

const PROJECT_LIMIT = 2;

export const Route = createFileRoute("/_authenticated/workspace/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return <ProjectsContent />;
}

function ProjectsContent() {
  const navigate = useNavigate();
  const projects = useQuery(api.projects.listUserProjects);
  const createProject = useMutation(api.projects.createProject);
  const deleteProject = useMutation(api.projects.deleteProject);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<Id<"projects"> | null>(null);

  const projectCount = projects?.length ?? 0;
  const limitReached = projectCount >= PROJECT_LIMIT;

  const handleCreateProject = async () => {
    const trimmedName = pendingName.trim();
    if (trimmedName.length === 0) {
      setErrorMessage("Project name is required.");
      return;
    }

    setErrorMessage(null);
    setIsCreating(true);
    try {
      await createProject({ name: trimmedName });
      toast.success(`Created project "${trimmedName}"`);
      setPendingName("");
      setIsDialogOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to create project. Please try again.");
      }
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: Id<"projects">) => {
    setErrorMessage(null);
    setDeletingProjectId(projectId);
    try {
      await deleteProject({ projectId });
      toast.success("Project deleted");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to delete project. Please try again.");
      }
      toast.error("Failed to delete project");
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Organize your research documents into dedicated spaces.
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          {projectCount}/{PROJECT_LIMIT} projects
        </span>
      </header>

      {errorMessage ? <ValidationError message={errorMessage} /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setIsDialogOpen(true);
          }}
          disabled={limitReached}
        >
          New Project
        </Button>
        {limitReached ? (
          <p className="text-sm text-muted-foreground">You have reached the project limit.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can create {PROJECT_LIMIT - projectCount} more project
            {PROJECT_LIMIT - projectCount === 1 ? "" : "s"}.
          </p>
        )}
      </div>

      {projects === undefined ? (
        <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Loading projects…
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="Create your first project"
          description="Start by creating a project to group your documents."
          action={
            <Button
              type="button"
              onClick={() => {
                setIsDialogOpen(true);
              }}
              disabled={limitReached}
            >
              New Project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project as Doc<"projects">}
              onOpen={(selected) => {
                navigate({
                  to: "/workspace/$projectHandle",
                  params: { projectHandle: selected.handle },
                });
              }}
              onDelete={handleDeleteProject}
              isDeleting={deletingProjectId === project._id}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!isCreating) {
            setErrorMessage(null);
            setIsDialogOpen(open);
          }
        }}
        projectName={pendingName}
        onProjectNameChange={setPendingName}
        onSubmit={handleCreateProject}
        isCreating={isCreating}
        disabled={limitReached}
        errorMessage={errorMessage}
      />
    </div>
  );
}

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  onSubmit: () => void;
  isCreating: boolean;
  disabled: boolean;
  errorMessage: string | null;
};

function CreateProjectDialog({
  open,
  onOpenChange,
  projectName,
  onProjectNameChange,
  onSubmit,
  isCreating,
  disabled,
  errorMessage,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Pick a name for your workspace. The handle will be generated automatically.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? <ValidationError message={errorMessage} /> : null}

        <label className="mt-3 flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Project name</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/40"
            placeholder="e.g. Customer interviews"
            value={projectName}
            onChange={(event) => {
              onProjectNameChange(event.target.value);
            }}
            disabled={isCreating || disabled}
          />
        </label>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isCreating}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={onSubmit} disabled={isCreating || disabled}>
            {isCreating ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
