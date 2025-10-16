import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ConflictModal } from "./-components/conflict-modal";

export const Route = createFileRoute("/_authenticated/workspace/$docId/")({
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
  const [isSaving, setIsSaving] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const localRevisionToken = useRef(document.revisionToken);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const normalizeTags = (tags: string[]) =>
    tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);

  const normalizedDraftTags = normalizeTags(draftTags);
  const normalizedDocumentTags = normalizeTags(document.tags);

  const tagsChanged =
    normalizedDraftTags.length !== normalizedDocumentTags.length ||
    normalizedDraftTags.some((tag, index) => tag !== normalizedDocumentTags[index]);

  const isDirty =
    draftBody !== document.body || draftTitle.trim() !== document.title || tagsChanged;

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
    setIsTitleEditing(false);
    setConflictModalOpen(true);
  }, [document.revisionToken, document.body, document.title, document.tags]);

  // Focus title input when entering edit mode
  useEffect(() => {
    if (isTitleEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isTitleEditing]);

  const updatedLabel = format(new Date(document.updated), "PPp");

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
    <div className="flex w-full flex-col gap-8">
      {/* Title Section - Linear-like inline editable */}
      <div className="space-y-6">
        <div className="group">
          {isTitleEditing ? (
            <input
              ref={titleInputRef}
              type="text"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={() => setIsTitleEditing(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setIsTitleEditing(false);
                }
                if (event.key === "Escape") {
                  setDraftTitle(document.title);
                  setIsTitleEditing(false);
                }
              }}
              disabled={isSaving}
              className="w-full bg-transparent text-4xl font-bold text-foreground outline-none border-b-2 border-primary pb-1"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsTitleEditing(true)}
              disabled={isSaving}
              className="w-full text-left text-4xl font-bold text-foreground hover:text-foreground/80 transition-colors border-b-2 border-transparent hover:border-border/40 pb-1 group-hover:border-border/40"
            >
              {draftTitle || "Untitled Document"}
            </button>
          )}
        </div>

        {/* Metadata Section - Compact layout */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Tags */}
          <div className="flex-1 min-w-[300px]">
            <div className="flex flex-wrap items-center gap-2">
              {draftTags.map((tag, index) => (
                <button
                  key={tag}
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/50 px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-primary/10"
                  onClick={() => removeTagAtIndex(index)}
                  disabled={isSaving}
                >
                  <span>{tag}</span>
                  <XIcon className="size-3" aria-hidden />
                  <span className="sr-only">Remove {tag}</span>
                </button>
              ))}
              <input
                id="tag-input"
                className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 px-2 py-1"
                placeholder={draftTags.length === 0 ? "Add tags..." : ""}
                value={pendingTag}
                onChange={(event) => setPendingTag(event.target.value)}
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
                onBlur={() => commitPendingTag()}
                disabled={isSaving}
              />
            </div>
            {availableSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {availableSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-full border border-border/30 bg-background/50 px-2 py-0.5 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                    onClick={() => addTag(suggestion)}
                    disabled={isSaving}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(activeTab === "preview" ? "edit" : "preview")}
            disabled={isSaving}
            className="gap-2"
          >
            <PencilIcon className="size-4" aria-hidden />
            {activeTab === "preview" ? "Edit markdown" : "View preview"}
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Updated {updatedLabel}</span>
            <div className="flex items-center gap-2">
              {isSaving ? (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Spinner className="size-3" />
                  Saving...
                </span>
              ) : isDirty ? (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  Unsaved changes
                </span>
              ) : (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckIcon className="size-3 text-green-600" />
                  Saved
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>

        {/* Editor/Preview */}
        {activeTab === "edit" ? (
          <div className="w-full overflow-hidden rounded-lg border border-border/30 bg-background/40">
            <textarea
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
              className="min-h-[60vh] w-full resize-y bg-transparent px-6 py-6 font-mono text-[0.95rem] leading-7 text-foreground outline-none focus-visible:outline-none"
              spellCheck={false}
              placeholder="Start writing..."
            />
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-lg border border-border/30 bg-background/40">
            <article className="min-h-[60vh] space-y-5 px-6 py-6 text-[0.95rem] leading-7 text-foreground">
              {draftBody ? (
                <Streamdown>{draftBody}</Streamdown>
              ) : (
                <p className="text-muted-foreground italic">Nothing to preview yet...</p>
              )}
            </article>
          </div>
        )}
      </div>

      <ConflictModal
        open={conflictModalOpen}
        onDismiss={() => setConflictModalOpen(false)}
        onReload={() => setConflictModalOpen(false)}
      />
    </div>
  );
}
