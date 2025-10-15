import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { EyeIcon, FilePenLineIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [draftTags, setDraftTags] = useState<string[]>(document.tags);
  const [pendingTag, setPendingTag] = useState("");
  const [draftStatus, setDraftStatus] = useState(document.status);
  const [isSaving, setIsSaving] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const localRevisionToken = useRef(document.revisionToken);

  const activityMessage = `Loaded at ${formatTimestamp(document.updated)}`;

  const normalizeTags = (tags: string[]) =>
    tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);

  const normalizedDraftTags = normalizeTags(draftTags);
  const normalizedDocumentTags = normalizeTags(document.tags);

  const tagsChanged =
    normalizedDraftTags.length !== normalizedDocumentTags.length ||
    normalizedDraftTags.some((tag, index) => tag !== normalizedDocumentTags[index]);

  const isDirty =
    draftBody !== document.body ||
    draftTitle.trim() !== document.title ||
    tagsChanged ||
    draftStatus.trim() !== document.status;

  const tagSuggestions = ["Meeting notes", "Research", "Reference", "Action Item", "Follow-up"];
  const lowercasedDraftTags = normalizedDraftTags.map((tag) => tag.toLowerCase());
  const availableSuggestions = tagSuggestions.filter(
    (suggestion) => !lowercasedDraftTags.includes(suggestion.toLowerCase()),
  );

  const addTag = (value: string) => {
    const normalizedTag = value.trim();
    if (normalizedTag.length === 0) {
      return;
    }

    setDraftTags((previous) => {
      if (previous.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())) {
        return previous;
      }
      return [...previous, normalizedTag];
    });
    setPendingTag("");
  };

  const removeTagAtIndex = (indexToRemove: number) => {
    setDraftTags((previous) => previous.filter((_, index) => index !== indexToRemove));
  };

  const commitPendingTag = () => {
    if (pendingTag.trim().length === 0) {
      setPendingTag("");
      return;
    }
    addTag(pendingTag);
  };

  useEffect(() => {
    if (localRevisionToken.current === document.revisionToken) {
      return;
    }

    // Update local state with remote changes when a conflict is detected
    setDraftBody(document.body);
    setDraftTitle(document.title);
    setDraftTags(document.tags);
    setPendingTag("");
    setDraftStatus(document.status);
    setConflictModalOpen(true);
  }, [document.revisionToken, document.body, document.title, document.tags, document.status]);

  const limitKilobytes = Math.round((MAX_DOCUMENT_SIZE_BYTES / 1024) * 10) / 10;
  const savedSizeKilobytes = Math.round((document.sizeBytes / 1024) * 10) / 10;

  const formatStatusLabel = (value: string) =>
    value
      .split("-")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");

  const statusLabel = formatStatusLabel(draftStatus);
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
        title: draftTitle,
        tags: normalizedDraftTags,
        status: draftStatus,
        revisionToken: document.revisionToken,
      });

      if (updatedDocument) {
        localRevisionToken.current = updatedDocument.revisionToken;
        setDraftTags(updatedDocument.tags);
      }

      toast.success("Document saved");
    } catch (_error) {
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-5">
      <Card className="border-border/40 bg-background/60 backdrop-blur-md">
        <CardContent className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
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
              <p className="text-xs text-muted-foreground">
                Shown in the project navigator and document listings.
              </p>
            </div>

            <div className="space-y-3">
              <label htmlFor="tag-input" className="text-sm font-medium text-foreground">
                Tags
              </label>
              <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {draftTags.map((tag, index) => (
                    <button
                      key={tag}
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/80 px-2 py-1 text-xs font-medium text-foreground transition hover:border-primary/60 hover:bg-primary/10"
                      onClick={() => {
                        removeTagAtIndex(index);
                      }}
                      disabled={isSaving}
                    >
                      <span>{tag}</span>
                      <XIcon className="size-3.5" aria-hidden />
                      <span className="sr-only">Remove {tag}</span>
                    </button>
                  ))}
                  <input
                    id="tag-input"
                    className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                    placeholder={draftTags.length === 0 ? "Add a tag…" : "Add another tag"}
                    value={pendingTag}
                    onChange={(event) => {
                      setPendingTag(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
                        event.preventDefault();
                        commitPendingTag();
                      } else if (
                        event.key === "Backspace" &&
                        pendingTag.length === 0 &&
                        draftTags.length > 0
                      ) {
                        event.preventDefault();
                        removeTagAtIndex(draftTags.length - 1);
                      }
                    }}
                    onBlur={() => {
                      commitPendingTag();
                    }}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Press Enter to save a tag. Suggestions help keep naming consistent.
              </p>
              {availableSuggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2 text-xs">
                  {availableSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="rounded-full border border-border/40 bg-background/80 px-3 py-1 font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                      onClick={() => {
                        addTag(suggestion);
                      }}
                      disabled={isSaving}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4 rounded-lg border border-border/50 bg-background/70 p-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <Select
                value={draftStatus}
                onValueChange={(value) => {
                  setDraftStatus(value);
                }}
                disabled={isSaving}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </aside>
        </CardContent>
      </Card>

      <Tabs defaultValue="edit" className="gap-3 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-2">
          <TabsList className="bg-background/80">
            <TabsTrigger value="edit" className="px-3">
              <FilePenLineIcon className="size-4" aria-hidden />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="px-3">
              <EyeIcon className="size-4" aria-hidden />
              Preview
            </TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {savedSizeKilobytes !== null ? (
              <span className="inline-flex items-center rounded-full border border-border/50 bg-background/70 px-2 py-1">
                {savedSizeKilobytes} KB of {limitKilobytes} KB
              </span>
            ) : null}
            <span className="inline-flex items-center rounded-full border border-border/50 bg-background/70 px-2 py-1">
              Updated {updatedLabel}
            </span>
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
        </div>
        <TabsContent value="edit" className="mt-0">
          <div className="mx-auto w-full overflow-hidden rounded-2xl border border-border/50 bg-background/60 shadow-lg">
            <textarea
              value={draftBody}
              onChange={(event) => {
                const nextBody = event.target.value;
                setDraftBody(nextBody);
              }}
              className="min-h-[60vh] w-full resize-y bg-background/70 px-6 py-6 font-mono text-[0.95rem] leading-7 text-foreground/90 outline-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              spellCheck={false}
            />
          </div>
        </TabsContent>
        <TabsContent value="preview" className="mt-0">
          <div className="mx-auto w-full overflow-hidden rounded-2xl border border-border/50 bg-background/60 shadow-lg">
            <article className="min-h-[60vh] space-y-5 px-6 py-6 text-[0.95rem] leading-7 text-muted-foreground">
              <Streamdown>{draftBody}</Streamdown>
            </article>
          </div>
        </TabsContent>
      </Tabs>

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
