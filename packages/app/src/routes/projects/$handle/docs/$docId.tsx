import { SignInButton } from "@clerk/clerk-react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { baseAppBreadcrumb, PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidationError } from "@/components/validation-error";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

const MAX_DOCUMENT_SIZE_BYTES = 800 * 1024;

export const Route = createFileRoute("/projects/$handle/docs/$docId")({
  component: DocumentEditorPage,
});

function DocumentEditorPage() {
  const { handle, docId } = Route.useParams();

  return (
    <div className="space-y-6">
      <AuthLoading>
        <div className="space-y-4">
          <PageBreadcrumbs
            items={[baseAppBreadcrumb, { label: "Loading…" }]}
            className="text-xs text-muted-foreground"
          />
          <LoadingNotice message="Loading document…" />
        </div>
      </AuthLoading>
      <Authenticated>
        <DocumentEditorLoader handle={handle} docId={docId as Id<"documents">} />
      </Authenticated>
      <Unauthenticated>
        <div className="space-y-4">
          <PageBreadcrumbs items={[baseAppBreadcrumb]} className="text-xs text-muted-foreground" />
          <SignInPrompt />
        </div>
      </Unauthenticated>
    </div>
  );
}

type DocumentEditorProps = {
  project: Doc<"projects">;
  document: Doc<"documents">;
};

type DocumentEditorLoaderProps = {
  handle: string;
  docId: Id<"documents">;
};

function DocumentEditorLoader({ handle, docId }: DocumentEditorLoaderProps) {
  const project = useQuery(api.projects.getProjectByHandle, { handle });
  const document = useQuery(api.documents.getDocument, { documentId: docId });

  if (project === undefined || document === undefined) {
    return (
      <>
        <PageBreadcrumbs
          items={[baseAppBreadcrumb, { label: "Loading…" }]}
          className="text-xs text-muted-foreground"
        />
        <LoadingNotice message="Loading document…" />
      </>
    );
  }

  if (project === null || document === null || document.projectId !== project._id) {
    throw notFound();
  }

  return (
    <>
      <PageBreadcrumbs
        items={[
          baseAppBreadcrumb,
          {
            label: project.name,
            to: { to: "/projects/$handle", params: { handle: project.handle } },
          },
          { label: document.title },
        ]}
        className="text-xs text-muted-foreground"
      />
      <DocumentEditor project={project} document={document} />
    </>
  );
}

function DocumentEditor({ project, document }: DocumentEditorProps) {
  const updateDocument = useMutation(api.documents.updateDocument);
  const [body, setBody] = useState(document.body);
  const [lastSyncedUpdated, setLastSyncedUpdated] = useState<number | null>(document.updated);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (document.updated !== lastSyncedUpdated) {
      setBody(document.body);
      setLastSyncedUpdated(document.updated);
    }
  }, [document, lastSyncedUpdated]);

  const sizeBytes = new TextEncoder().encode(body).length;
  const sizeKilobytes = Math.round((sizeBytes / 1024) * 10) / 10;
  const limitKilobytes = Math.round((MAX_DOCUMENT_SIZE_BYTES / 1024) * 10) / 10;
  const isOverLimit = sizeBytes > MAX_DOCUMENT_SIZE_BYTES;

  const isDirty = body !== document.body;
  const statusLabel = (document.status ?? "draft").toLowerCase();
  const formattedStatus = statusLabel.slice(0, 1).toUpperCase() + statusLabel.slice(1);
  const sizeLabel = `${sizeKilobytes} KB / ${limitKilobytes} KB`;
  const updatedLabel = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(document.updated));

  const handleSave = async () => {
    if (!isDirty || isSaving) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await updateDocument({
        documentId: document._id,
        body,
      });
      toast.success("Document saved");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to save document. Please try again.");
      }
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <Card className="border-border/60 bg-muted/10 shadow-sm shadow-primary/5 backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              Project · {project.name}
            </span>
            <CardTitle className="text-3xl font-semibold text-foreground">
              {document.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Make edits below and save when you are ready. Your changes sync instantly across
              devices.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {formattedStatus}
            </span>
            <span
              className={`text-xs ${isOverLimit ? "font-semibold text-destructive" : "text-muted-foreground"}`}
            >
              {sizeLabel}
            </span>
            <span className="text-xs text-muted-foreground">Updated {updatedLabel}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !isDirty || isOverLimit}
            >
              {isSaving ? "Saving…" : isDirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {errorMessage ? <ValidationError message={errorMessage} /> : null}

      <Card className="border-border/60 bg-background/70 shadow-lg shadow-primary/5">
        <CardContent className="p-0">
          <textarea
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
            }}
            className="min-h-[60vh] w-full resize-y bg-transparent px-6 py-6 font-mono text-[0.95rem] leading-relaxed text-foreground outline-none focus-visible:outline-none focus-visible:ring-0"
            spellCheck={false}
            aria-invalid={isOverLimit}
          />
        </CardContent>
      </Card>

      {isOverLimit ? (
        <p className="text-xs font-semibold text-destructive">
          Document exceeds the 800KB limit. Trim the content before saving.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Document size updates as you type. Keep under 800KB for reliable syncing.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Last updated on {updatedLabel}. Unsaved changes are highlighted above.
      </p>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border px-4 py-6">
      <p className="text-sm text-muted-foreground">
        Sign in to open and edit documents in this project.
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
