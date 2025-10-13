import { SignInButton } from "@clerk/clerk-react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { useState } from "react";
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
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { DocumentListItem } from "./-components/document-list-item";

const DOCUMENT_LIMIT = 5;

export const Route = createFileRoute("/projects/$handle/")({
  component: ProjectDocumentsPage,
});

function ProjectDocumentsPage() {
  const { handle } = Route.useParams();

  return (
    <div className="space-y-6">
      <AuthLoading>
        <LoadingNotice message="Loading project…" />
      </AuthLoading>
      <Authenticated>
        <ProjectDocumentsLoader handle={handle} />
      </Authenticated>
      <Unauthenticated>
        <SignInPrompt />
      </Unauthenticated>
    </div>
  );
}

type ProjectDocumentsLoaderProps = {
  handle: string;
};

function ProjectDocumentsLoader({ handle }: ProjectDocumentsLoaderProps) {
  const project = useQuery(api.projects.getProjectByHandle, { handle });

  if (project === undefined) {
    return <LoadingNotice message="Loading project…" />;
  }

  if (project === null) {
    throw notFound();
  }

  return <ProjectDocumentsContent project={project} />;
}

type ProjectDocumentsContentProps = {
  project: Doc<"projects">;
};

function ProjectDocumentsContent({ project }: ProjectDocumentsContentProps) {
  const navigate = useNavigate();
  const documents = useQuery(api.documents.listProjectDocuments, { projectId: project._id });
  const createDocument = useMutation(api.documents.createDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingTitle, setPendingTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<Id<"documents"> | null>(null);

  const documentCount = documents?.length ?? 0;
  const limitReached = documentCount >= DOCUMENT_LIMIT;

  const handleCreateDocument = async () => {
    setErrorMessage(null);
    setIsCreating(true);
    try {
      const newDoc = await createDocument({
        projectId: project._id,
        title: pendingTitle.trim() === "" ? undefined : pendingTitle.trim(),
      });
      setPendingTitle("");
      setIsDialogOpen(false);
      if (newDoc) {
        navigate({
          to: "/projects/$handle/docs/$docId",
          params: {
            handle: project.handle,
            docId: newDoc._id,
          },
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to create document. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async (documentId: Id<"documents">) => {
    setErrorMessage(null);
    setDeletingDocumentId(documentId);
    try {
      await deleteDocument({ documentId });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to delete document. Please try again.");
      }
    } finally {
      setDeletingDocumentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground">Handle: {project.handle}</p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          {documentCount}/{DOCUMENT_LIMIT} documents
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
          New Document
        </Button>
        {limitReached ? (
          <p className="text-sm text-muted-foreground">You have reached the document limit.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can create {DOCUMENT_LIMIT - documentCount} more document
            {DOCUMENT_LIMIT - documentCount === 1 ? "" : "s"}.
          </p>
        )}
      </div>

      {documents === undefined ? (
        <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Loading documents…
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Create your first document to start capturing knowledge in this project."
          action={
            <Button
              type="button"
              onClick={() => {
                setIsDialogOpen(true);
              }}
              disabled={limitReached}
            >
              New Document
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <DocumentListItem
              key={document._id}
              document={document}
              onOpen={(docId) => {
                navigate({
                  to: "/projects/$handle/docs/$docId",
                  params: { handle: project.handle, docId },
                });
              }}
              onDelete={handleDeleteDocument}
              isDeleting={deletingDocumentId === document._id}
            />
          ))}
        </div>
      )}

      <CreateDocumentDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!isCreating) {
            setErrorMessage(null);
            setIsDialogOpen(open);
          }
        }}
        documentTitle={pendingTitle}
        onDocumentTitleChange={setPendingTitle}
        onSubmit={handleCreateDocument}
        isCreating={isCreating}
        disabled={limitReached}
        errorMessage={errorMessage}
      />
    </div>
  );
}

type CreateDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle: string;
  onDocumentTitleChange: (value: string) => void;
  onSubmit: () => void;
  isCreating: boolean;
  disabled: boolean;
  errorMessage: string | null;
};

function CreateDocumentDialog({
  open,
  onOpenChange,
  documentTitle,
  onDocumentTitleChange,
  onSubmit,
  isCreating,
  disabled,
  errorMessage,
}: CreateDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>
            Optionally give your document a title. You can edit the frontmatter later.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? <ValidationError message={errorMessage} /> : null}

        <label className="mt-3 flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Title</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/40"
            placeholder="e.g. Meeting notes"
            value={documentTitle}
            onChange={(event) => {
              onDocumentTitleChange(event.target.value);
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

function SignInPrompt() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border px-4 py-6">
      <p className="text-sm text-muted-foreground">
        Sign in to view this project and manage its documents.
      </p>
      <SignInButton mode="modal">
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          Sign in
        </button>
      </SignInButton>
    </div>
  );
}

function LoadingNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
