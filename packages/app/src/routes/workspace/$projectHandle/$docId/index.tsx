import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { EyeIcon, FilePenLineIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
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

export const Route = createFileRoute("/workspace/$projectHandle/$docId/")({
  component: DocumentEditorPage,
});

function DocumentEditorPage() {
  const { docId } = Route.useParams();
  return <DocumentEditorLoader docId={docId as Id<"documents">} />;
}

type DocumentEditorProps = {
  document: Doc<"documents">;
};

type DocumentEditorLoaderProps = {
  docId: Id<"documents">;
};

// TODO: Project should not be necessary here. We can just get the document directly.
function DocumentEditorLoader({ docId }: DocumentEditorLoaderProps) {
  const document = useQuery(api.documents.getDocument, { documentId: docId });

  if (document === undefined) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
        Loading document…
      </div>
    );
  }

  if (document === null) {
    throw notFound();
  }

  return <DocumentEditor document={document} />;
}

function DocumentEditor({ document }: DocumentEditorProps) {
  const updateDocument = useMutation(api.documents.updateDocument);
  const [draftBody, setDraftBody] = useState(document.body);
  const [draftTitle, setDraftTitle] = useState(document.title);
  const [draftTags, setDraftTags] = useState(document.tags.join(", "));
  const [draftStatus, setDraftStatus] = useState(document.status);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // TODO: not necessary. We should change how we handle preview.
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const localRevisionToken = useRef(document.revisionToken);

  const activityMessage = `Loaded at ${formatTimestamp(document.updated)}`;

  const isDirty =
    draftBody !== document.body ||
    draftTitle.trim() !== document.title ||
    draftTags !== document.tags.join(", ") ||
    draftStatus.trim() !== document.status;

  useEffect(() => {
    if (localRevisionToken.current === document.revisionToken) {
      return;
    }

    // Update local state with remote changes when a conflict is detected
    setDraftBody(document.body);
    setDraftTitle(document.title);
    setDraftTags(document.tags.join(", "));
    setDraftStatus(document.status);
    setConflictModalOpen(true);
  }, [document.revisionToken, document.body, document.title, document.tags, document.status]);

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
      const tagsArray = draftTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const updatedDocument = await updateDocument({
        documentId: document._id,
        body: draftBody,
        title: draftTitle,
        tags: tagsArray,
        status: draftStatus,
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card className="border-border/60 bg-muted/10 shadow-sm shadow-primary/5 backdrop-blur">
        <CardHeader className="flex flex-col gap-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Title
              </label>
              <input
                id="title"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/40"
                value={draftTitle}
                onChange={(event) => {
                  setDraftTitle(event.target.value);
                }}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tags" className="text-sm font-medium text-foreground">
                Tags
              </label>
              <input
                id="tags"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. important, meeting, notes"
                value={draftTags}
                onChange={(event) => {
                  setDraftTags(event.target.value);
                }}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="status"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/40"
                value={draftStatus}
                onChange={(event) => {
                  setDraftStatus(event.target.value);
                }}
                disabled={isSaving}
              >
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 text-xs text-muted-foreground md:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 font-semibold uppercase tracking-wide text-[0.7rem] text-foreground">
                {statusLabel}
              </span>
              {savedSizeKilobytes !== null ? (
                <span>
                  {savedSizeKilobytes} KB of {limitKilobytes} KB
                </span>
              ) : null}
              <span>Updated {updatedLabel}</span>
            </div>
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
        </CardHeader>
      </Card>

      <div className="flex flex-col gap-2 rounded-lg border bg-background/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        {activityMessage ? (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {activityMessage}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Connected</span>
        )}
        <div className="inline-flex items-center gap-2">
          <Button
            type="button"
            variant={showPreview ? "ghost" : "secondary"}
            size="sm"
            onClick={() => {
              setShowPreview(false);
            }}
            aria-pressed={!showPreview}
          >
            <FilePenLineIcon className="mr-2 size-4" aria-hidden />
            Edit
          </Button>
          <Button
            type="button"
            variant={showPreview ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setShowPreview(true);
            }}
            aria-pressed={showPreview}
          >
            <EyeIcon className="mr-2 size-4" aria-hidden />
            Preview
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background/80">
        {showPreview ? (
          <div className="min-h-[55vh] px-4 py-5 text-sm leading-6 text-foreground">
            <Streamdown>{draftBody}</Streamdown>
          </div>
        ) : (
          <textarea
            value={draftBody}
            onChange={(event) => {
              const nextBody = event.target.value;
              setDraftBody(nextBody);
            }}
            className="min-h-[55vh] w-full resize-y bg-transparent px-4 py-5 font-mono text-sm leading-6 text-foreground outline-none focus-visible:outline-none focus-visible:ring-0"
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
