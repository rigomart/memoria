import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { Copy, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ValidationError } from "@/components/validation-error";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const MAX_TOKENS_PER_USER = 10;

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

type TokenSummary = {
  _id: Id<"tokens">;
  name: string;
  createdAt: number;
  lastUsedAt?: number;
};

function SettingsPage() {
  const tokens = useQuery(api.tokens.listUserTokens);
  const createToken = useMutation(api.tokens.createToken);
  const deleteToken = useMutation(api.tokens.deleteToken);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [revealedToken, setRevealedToken] = useState<{ value: string; name: string } | null>(null);
  const [deletingTokenId, setDeletingTokenId] = useState<Id<"tokens"> | null>(null);

  const tokenCount = tokens?.length ?? 0;
  const limitReached = tokenCount >= MAX_TOKENS_PER_USER;

  const orderedTokens = useMemo(() => tokens ?? [], [tokens]);

  const handleCreateToken = async () => {
    const trimmedName = newTokenName.trim();
    if (!trimmedName) {
      setCreationError("Token name is required.");
      return;
    }

    setCreationError(null);
    setIsCreating(true);
    try {
      const result = await createToken({ name: trimmedName });
      setIsCreateDialogOpen(false);
      setNewTokenName("");
      setRevealedToken({ value: result.token, name: result.name });
      toast.success(`Created token "${result.name}"`);
    } catch (error) {
      if (error instanceof Error) {
        setCreationError(error.message);
      } else {
        setCreationError("Failed to create token. Please try again.");
      }
      toast.error("Failed to create token");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteToken = async (tokenId: Id<"tokens">, name: string) => {
    setDeletingTokenId(tokenId);
    try {
      await deleteToken({ tokenId });
      toast.success(`Deleted token "${name}"`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete token. Please try again.");
      }
    } finally {
      setDeletingTokenId(null);
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Token copied to clipboard");
    } catch {
      toast.error("Failed to copy token");
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-4 rounded-xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-foreground sm:text-xl">
                Personal Access Tokens
              </h1>
              <p className="text-sm text-muted-foreground">
                Tokens authenticate MCP clients against your Memoria workspace. Each token is shown
                only once.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setCreationError(null);
                setIsCreateDialogOpen(true);
              }}
              disabled={limitReached}
            >
              <Plus className="size-4" />
              New token
            </Button>
          </div>

          {limitReached ? (
            <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              You have reached the limit of {MAX_TOKENS_PER_USER} tokens. Delete an existing token
              to create a new one.
            </p>
          ) : null}

          {tokens === undefined ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Loading tokens…
            </div>
          ) : orderedTokens.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
              No tokens yet. Generate your first token to connect an MCP client.
            </div>
          ) : (
            <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-background/60">
              {orderedTokens.map((token) => (
                <TokenListItem
                  key={token._id}
                  token={token}
                  isDeleting={deletingTokenId === token._id}
                  onDelete={handleDeleteToken}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Create access token</DialogTitle>
            <DialogDescription>
              Generate a new personal access token for use with MCP clients.
            </DialogDescription>
          </DialogHeader>

          {creationError ? <ValidationError message={creationError} /> : null}

          <label className="mt-3 flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Token name</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. Claude desktop"
              value={newTokenName}
              onChange={(event) => {
                setNewTokenName(event.target.value);
              }}
              disabled={isCreating}
            />
          </label>

          <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!isCreating) {
                  setCreationError(null);
                  setNewTokenName("");
                  setIsCreateDialogOpen(false);
                }
              }}
              disabled={isCreating}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateToken} disabled={isCreating}>
              <Plus className="size-4" />
              {isCreating ? "Creating…" : "Create token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={revealedToken !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRevealedToken(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your token</DialogTitle>
            <DialogDescription>
              This token will not be shown again. Store it securely before closing.
            </DialogDescription>
          </DialogHeader>

          {revealedToken ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
                <p className="text-xs uppercase text-muted-foreground">Token</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <code className="break-all font-mono text-sm text-foreground">
                    {revealedToken.value}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void handleCopyToken(revealedToken.value);
                    }}
                  >
                    <Copy className="size-4" />
                    Copy
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Add this token to your MCP server or client configuration to authenticate requests.
              </p>
            </div>
          ) : null}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              onClick={() => {
                setRevealedToken(null);
              }}
            >
              <X className="size-4" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type TokenListItemProps = {
  token: TokenSummary;
  onDelete: (tokenId: Id<"tokens">, name: string) => Promise<void>;
  isDeleting: boolean;
};

function TokenListItem({ token, onDelete, isDeleting }: TokenListItemProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const formattedCreatedAt = useMemo(
    () => format(new Date(token.createdAt), "MMM d, yyyy"),
    [token.createdAt],
  );

  const formattedLastUsed =
    token.lastUsedAt != null ? format(new Date(token.lastUsedAt), "MMM d, yyyy p") : "Never";

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
      <div>
        <p className="text-sm font-medium text-foreground">{token.name}</p>
        <p className="text-xs text-muted-foreground">
          Created {formattedCreatedAt} • Last used {formattedLastUsed}
        </p>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAlertOpen(true);
            }}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete token</span>
          </Button>
        </div>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this token?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing the token automatically revokes access for any connected MCP clients. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsAlertOpen(false);
                void onDelete(token._id, token.name);
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
