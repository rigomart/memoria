import { SignInButton } from "@clerk/clerk-react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { baseAppBreadcrumb, PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { Button } from "@/components/ui/button";
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (document.updated !== lastSyncedUpdated) {
      setBody(document.body);
      setLastSyncedUpdated(document.updated);
    }
  }, [document, lastSyncedUpdated]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const sizeBytes = new TextEncoder().encode(body).length;
  const sizeKilobytes = Math.round((sizeBytes / 1024) * 10) / 10;
  const limitKilobytes = Math.round((MAX_DOCUMENT_SIZE_BYTES / 1024) * 10) / 10;
  const isOverLimit = sizeBytes > MAX_DOCUMENT_SIZE_BYTES;

  const isDirty = body !== document.body;

  const handleSave = async () => {
    if (!isDirty || isSaving) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateDocument({
        documentId: document._id,
        body,
      });
      setSuccessMessage("Document saved");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to save document. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Project</p>
        <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
        <p className="text-sm text-muted-foreground">Editing “{document.title}”</p>
      </header>

      {errorMessage ? <ValidationError message={errorMessage} /> : null}
      {successMessage ? (
        <div className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-500">
          {successMessage}
        </div>
      ) : null}

      <section className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-border px-3 py-1 font-medium text-muted-foreground">
          {sizeKilobytes} KB / {limitKilobytes} KB
        </span>
        {isOverLimit ? (
          <span className="text-sm font-medium text-destructive">
            Document exceeds the 800KB limit. Please reduce its size before saving.
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            Document size updates as you type. Keep under 800KB for reliable syncing.
          </span>
        )}
      </section>

      <textarea
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
        }}
        className="min-h-[60vh] w-full flex-1 resize-vertical rounded-md border border-input bg-background px-4 py-3 font-mono text-sm leading-relaxed text-foreground outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/40"
        spellCheck={false}
        aria-invalid={isOverLimit}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(document.updated).toLocaleString()}
        </p>
        <Button type="button" onClick={handleSave} disabled={isSaving || !isDirty || isOverLimit}>
          {isSaving ? "Saving…" : isDirty ? "Save changes" : "Saved"}
        </Button>
      </div>
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
