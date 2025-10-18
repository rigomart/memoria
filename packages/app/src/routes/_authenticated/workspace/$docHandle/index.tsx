import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { CheckIcon, EyeIcon, PencilIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { ConflictModal } from "./-components/conflict-modal";

export const Route = createFileRoute("/_authenticated/workspace/$docHandle/")({
  component: DocumentEditorPage,
});

function DocumentEditorPage() {
  const { docHandle } = Route.useParams();
  return <DocumentEditorLoader docHandle={docHandle} />;
}

type DocumentEditorProps = {
  document: Doc<"documents">;
};

type DocumentEditorLoaderProps = {
  docHandle: string;
};

function extractSuffix(handle: string): string | null {
  const lastDashIndex = handle.lastIndexOf("-");
  if (lastDashIndex === -1 || lastDashIndex === handle.length - 1) {
    return null;
  }
  return handle.slice(lastDashIndex + 1);
}

function DocumentEditorLoader({ docHandle }: DocumentEditorLoaderProps) {
  const navigate = Route.useNavigate();
  const suffix = extractSuffix(docHandle);
  if (!suffix) {
    throw notFound();
  }

  const document = useQuery(api.documents.getDocumentBySuffix, { suffix });
  const canonicalHandle =
    document && document !== null ? `${document.slug}-${document.suffix}` : null;

  useEffect(() => {
    if (!canonicalHandle || docHandle === canonicalHandle) {
      return;
    }
    void navigate({
      to: "/workspace/$docHandle",
      params: { docHandle: canonicalHandle },
      replace: true,
    });
  }, [canonicalHandle, docHandle, navigate]);

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

  if (canonicalHandle && docHandle !== canonicalHandle) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
        Redirecting to the latest document URL…
      </div>
    );
  }

  return <DocumentEditor document={document} />;
}

function DocumentEditor({ document }: DocumentEditorProps) {
  const updateDocument = useMutation(api.documents.updateDocument);

  // Combined draft state
  const [draft, setDraft] = useState({
    title: document.title,
    body: document.body,
    tags: document.tags,
  });

  const [pendingTag, setPendingTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  const localRevisionToken = useRef(document.revisionToken);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const normalizeTags = (tags: string[]) =>
    tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);

  const normalizedDraftTags = normalizeTags(draft.tags);
  const normalizedDocumentTags = normalizeTags(document.tags);

  const tagsChanged =
    normalizedDraftTags.length !== normalizedDocumentTags.length ||
    normalizedDraftTags.some((tag, index) => tag !== normalizedDocumentTags[index]);

  const isDirty =
    draft.body !== document.body || draft.title.trim() !== document.title || tagsChanged;

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

    setDraft((prev) => {
      if (prev.tags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())) {
        return prev;
      }
      return { ...prev, tags: [...prev.tags, normalizedTag] };
    });
    setPendingTag("");
    setIsAddingTag(false);
  };

  const removeTagAtIndex = (indexToRemove: number) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove),
    }));
  };

  const commitPendingTag = () => {
    if (pendingTag.trim().length === 0) {
      setPendingTag("");
      setIsAddingTag(false);
      return;
    }
    addTag(pendingTag);
    setIsAddingTag(false);
  };

  // Focus tag input when adding
  useEffect(() => {
    if (isAddingTag && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [isAddingTag]);

  // Detect external changes (conflicts)
  useEffect(() => {
    if (localRevisionToken.current === document.revisionToken) {
      return; // Our own save, ignore
    }

    // External change detected - update local state and show conflict modal
    setDraft({
      title: document.title,
      body: document.body,
      tags: document.tags,
    });
    setPendingTag("");
    setIsAddingTag(false);
    setSaveError(false);
    setConflictModalOpen(true);
  }, [document.revisionToken, document.body, document.title, document.tags]);

  const updatedLabel = format(new Date(document.updated), "PPp");

  // Auto-save function
  const performSave = useCallback(async () => {
    if (!isDirty || isSaving || saveError) {
      return; // Don't retry if there's already an error
    }

    setIsSaving(true);
    try {
      const updatedDocument = await updateDocument({
        documentId: document._id,
        body: draft.body,
        title: draft.title,
        tags: normalizedDraftTags,
        revisionToken: document.revisionToken,
      });

      if (updatedDocument) {
        localRevisionToken.current = updatedDocument.revisionToken;
        setDraft((prev) => ({ ...prev, tags: updatedDocument.tags }));
      }
    } catch (_error) {
      setSaveError(true);
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  }, [
    isDirty,
    isSaving,
    saveError,
    updateDocument,
    document._id,
    document.revisionToken,
    draft.body,
    draft.title,
    normalizedDraftTags,
  ]);

  // Debounced auto-save on draft changes
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    // Clear error state when user continues editing (new changes = retry)
    if (saveError) {
      setSaveError(false);
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for 500ms
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 500);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, performSave, saveError]);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Title Section - Always editable input */}
      <div className="space-y-1">
        <input
          type="text"
          value={draft.title}
          onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Untitled Document"
          disabled={isSaving}
          className="w-full bg-transparent text-4xl font-bold text-foreground outline-none border-b-2 border-transparent hover:border-border/40 focus:border-primary pb-1 transition-colors"
        />

        {/* Tags - Minimal inline */}
        <div className="flex flex-wrap items-center gap-2">
          {draft.tags.map((tag, index) => (
            <button
              key={tag}
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => removeTagAtIndex(index)}
              disabled={isSaving}
            >
              <span>{tag}</span>
              <XIcon className="size-2.5" aria-hidden />
              <span className="sr-only">Remove {tag}</span>
            </button>
          ))}

          {isAddingTag ? (
            <div className="relative">
              <input
                ref={tagInputRef}
                id="tag-input"
                className="min-w-[120px] rounded-md border border-border/50 bg-background px-2 py-0.5 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-primary"
                placeholder="Add tag..."
                value={pendingTag}
                onChange={(event) => setPendingTag(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
                    event.preventDefault();
                    commitPendingTag();
                  } else if (event.key === "Escape") {
                    setPendingTag("");
                    setIsAddingTag(false);
                  }
                }}
                onBlur={() => commitPendingTag()}
                disabled={isSaving}
              />
              {availableSuggestions.length > 0 && pendingTag.length === 0 && (
                <div className="absolute top-full left-0 mt-1 flex flex-wrap gap-1 rounded-md border border-border/50 bg-background p-2 shadow-lg z-10">
                  {availableSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="rounded-full bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur
                        addTag(suggestion);
                        setIsAddingTag(false);
                      }}
                      disabled={isSaving}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              disabled={isSaving}
              className="inline-flex items-center gap-1 rounded-full bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
            >
              <span>+</span>
              <span>Add tag</span>
            </button>
          )}
        </div>
      </div>

      <Tabs defaultValue="edit">
        <div className="flex gap-2 w-full items-center justify-between">
          <TabsList>
            <TabsTrigger value="edit">
              <PencilIcon className="size-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <EyeIcon className="size-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Updated {updatedLabel}</span>
            <div className="flex items-center gap-2">
              {isSaving ? (
                <span className="flex items-center gap-2 text-xs font-medium text-amber-600">
                  <Spinner className="size-3" />
                  Saving...
                </span>
              ) : saveError ? (
                <span className="flex items-center gap-2 text-xs font-medium text-red-600">
                  <XIcon className="size-3" />
                  Save failed
                </span>
              ) : isDirty ? (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  Editing...
                </span>
              ) : (
                <span className="flex items-center gap-2 text-xs font-medium text-green-600">
                  <CheckIcon className="size-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>

        <TabsContent value="edit">
          <div className="relative w-full overflow-hidden rounded-lg border-2 border-primary/30 bg-background/40">
            <div className="absolute right-3 top-3 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <PencilIcon className="size-3" />
                Edit Mode
              </span>
            </div>
            <textarea
              value={draft.body}
              onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))}
              className="min-h-[60vh] w-full resize-y bg-transparent px-6 py-6 font-mono text-[0.95rem] leading-7 text-foreground outline-none focus-visible:outline-none"
              spellCheck={false}
              placeholder="Start writing..."
            />
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <div className="relative w-full overflow-hidden rounded-lg border border-border/30 bg-background/40">
            <article className="min-h-[60vh] space-y-5 px-6 py-6 text-[0.95rem] leading-7 text-foreground">
              {draft.body ? (
                <Streamdown>{draft.body}</Streamdown>
              ) : (
                <p className="text-muted-foreground italic">Nothing to preview yet...</p>
              )}
            </article>
          </div>
        </TabsContent>
      </Tabs>

      <ConflictModal
        open={conflictModalOpen}
        onDismiss={() => setConflictModalOpen(false)}
        onReload={() => setConflictModalOpen(false)}
      />
    </div>
  );
}
