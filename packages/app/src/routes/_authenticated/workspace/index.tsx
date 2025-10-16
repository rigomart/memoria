import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Empty, 
  EmptyContent, 
  EmptyDescription, 
  EmptyHeader, 
  EmptyMedia, 
  EmptyTitle 
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
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
import type { Id } from "@/convex/_generated/dataModel";
import { DocumentListItem } from "./-components/document-list-item";

const DOCUMENT_LIMIT = 10;

export const Route = createFileRoute("/_authenticated/workspace/")({
  component: DocumentsPage,
});

function DocumentsPage() {
  return <DocumentsContent />;
}

function DocumentsContent() {
  const documents = useQuery(api.documents.listUserDocuments);
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
    const trimmedTitle = pendingTitle.trim();
    if (trimmedTitle.length === 0) {
      setErrorMessage("Document title is required.");
      return;
    }

    setErrorMessage(null);
    setIsCreating(true);
    try {
      await createDocument({ title: trimmedTitle });
      toast.success(`Created document "${trimmedTitle}"`);
      setPendingTitle("");
      setIsDialogOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to create document. Please try again.");
      }
      toast.error("Failed to create document");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async (documentId: Id<"documents">) => {
    setErrorMessage(null);
    setDeletingDocumentId(documentId);
    try {
      await deleteDocument({ documentId });
      toast.success("Document deleted");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to delete document. Please try again.");
      }
      toast.error("Failed to delete document");
    } finally {
      setDeletingDocumentId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Your personal knowledge base for architecture patterns, decisions, and specs.
          </p>
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
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Create your first document</EmptyTitle>
            <EmptyDescription>
              Start building your personal knowledge base with architecture patterns, meeting notes, or technical specifications.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              onClick={() => {
                setIsDialogOpen(true);
              }}
              disabled={limitReached}
            >
              New Document
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <DocumentListItem
              key={document._id}
              document={document}
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
          <DialogTitle>Create document</DialogTitle>
          <DialogDescription>Give your document a title to get started.</DialogDescription>
        </DialogHeader>

        {errorMessage ? <ValidationError message={errorMessage} /> : null}

        <label className="mt-3 flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Document title</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/40"
            placeholder="e.g. Architecture Decision: Microservices vs Monolith"
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
