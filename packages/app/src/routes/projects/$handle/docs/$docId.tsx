import { SignInButton } from "@clerk/clerk-react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { EyeIcon, FilePenLineIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { baseAppBreadcrumb, PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ConflictModal } from "./-components/conflict-modal";

const MAX_DOCUMENT_SIZE_BYTES = 800 * 1024;

function formatTimestamp(timestamp: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

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
  document: Doc<"documents">;
};

type DocumentEditorLoaderProps = {
  handle: string;
  docId: Id<"documents">;
};

// TODO: Project should not be necessary here. We can just get the document directly.
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
      <DocumentEditor document={document} />
    </>
  );
}

function DocumentEditor({ document }: DocumentEditorProps) {
  const updateDocument = useMutation(api.documents.updateDocument);
  const [draftBody, setDraftBody] = useState(document.body);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // TODO: not necessary. We should change how we handle preview.
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const localRevisionToken = useRef(document.revisionToken);

  const activityMessage = `Loaded at ${formatTimestamp(document.updated)}`;

  const isDirty = draftBody !== document.body;

  useEffect(() => {
    if (localRevisionToken.current === document.revisionToken) {
      return;
    }

    setConflictModalOpen(true);
  }, [document.revisionToken]);

  const limitKilobytes = Math.round((MAX_DOCUMENT_SIZE_BYTES / 1024) * 10) / 10;
  const savedSizeKilobytes = Math.round((document.sizeBytes / 1024) * 10) / 10;

  const statusLabel = document.status.toLowerCase();
  const updatedLabel = formatTimestamp(document.updated);

  const handleSave = async () => {
    if (!isDirty || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      const updatedDocument = await updateDocument({
        documentId: document._id,
        body: draftBody,
        revisionToken: document.revisionToken,
      });

      if (updatedDocument) {
        localRevisionToken.current = updatedDocument.revisionToken;
      }

      toast.success("Document saved");
    } catch (_error) {
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
            <CardTitle className="text-3xl font-semibold text-foreground">
              {document.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Make edits below and save when you are ready. Your changes sync instantly across
              devices.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase">
                {statusLabel}
              </span>
              {savedSizeKilobytes !== null ? (
                <span className="text-xs text-muted-foreground">
                  Saved size {savedSizeKilobytes} KB / {limitKilobytes} KB
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">Updated {updatedLabel}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPreview((previous) => !previous);
                }}
                aria-pressed={showPreview}
              >
                {showPreview ? (
                  <>
                    <FilePenLineIcon className="mr-2 size-4" aria-hidden />
                    Edit
                  </>
                ) : (
                  <>
                    <EyeIcon className="mr-2 size-4" aria-hidden />
                    Preview
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? "Saving…" : isDirty ? "Save changes" : "Saved"}
              </Button>
            </div>
            {activityMessage ? (
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {activityMessage}
              </span>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <div className="border rounded-lg">
        {showPreview ? (
          <div className="p-4 text-[0.95rem] leading-relaxed text-foreground">
            <Streamdown>{draftBody}</Streamdown>
          </div>
        ) : (
          <textarea
            value={draftBody}
            onChange={(event) => {
              const nextBody = event.target.value;
              setDraftBody(nextBody);
            }}
            className="min-h-[60vh] w-full resize-y bg-transparent p-4 font-mono text-[0.95rem] leading-relaxed text-foreground outline-none focus-visible:outline-none focus-visible:ring-0"
            spellCheck={false}
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Document size is recalculated when you save. If the saved file exceeds {limitKilobytes} KB,
        the save will fail so you can trim the content.
      </p>

      <ConflictModal
        open={conflictModalOpen}
        onDismiss={() => {
          setConflictModalOpen(false);
        }}
        onReload={() => {
          setConflictModalOpen(false);
        }}
      />
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
